import * as childProcess from 'child_process'
import * as fs from 'fs'
import path from 'path'
import getPort from 'get-port'
import { removeFilesFromDir } from '../common/utils'
import { EventEmitter } from 'events'
import { SocketActions, SocketEvents, SupportedPlatform } from '@quiet/types'
import { Inject, OnModuleInit } from '@nestjs/common'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { TorControl, TOR_EVENT_TIMEOUT_MS } from './tor-control.service'
import {
  type BootstrapStallState,
  type BootstrapStatus,
  GetInfoTorSignal,
  HiddenServiceData,
  type SpawnHiddenServiceParams,
  TorControlAuthType,
  TorParams,
  TorParamsProvider,
  TorPasswordProvider,
} from './tor.types'

import { createLogger } from '../common/logger'
import { toString as uint8ArrayToString } from 'uint8arrays'
import { isUint8Array } from 'util/types'

const BOOTSTRAP_DONE_PROGRESS = 100
const BOOTSTRAP_DONE_TAG = 'done'
// How long bootstrap may sit without its reported progress changing at all before
// Tor is restarted. Bootstrap speed belongs to the network, not to us: a healthy
// Tor was observed holding loading_descriptors for over two minutes, and a slow or
// throttled link can hold a phase far longer and still finish - while restarting
// throws away every bit of progress made so far.
const BOOTSTRAP_NO_PROGRESS_RESTART_MS = 10 * 60_000
// How often to report a bootstrap that is taking a long time but has not earned a
// restart, so a slow network is still visible in the logs.
const BOOTSTRAP_SLOW_LOG_INTERVAL_MS = 60_000
// Tor's advice when it reports a warning it is already handling.
const BOOTSTRAP_RECOMMENDATION_IGNORE = 'ignore'
const HIDDEN_SERVICE_DESCRIPTOR_EVENT = 'HS_DESC'

export class Tor extends EventEmitter implements OnModuleInit {
  socksPort: number
  process: childProcess.ChildProcessWithoutNullStreams | null = null
  torDataDirectory: string
  torPidPath: string
  extraTorProcessParams: TorParams
  controlPort: number | undefined
  interval: any
  initTimeout: any
  private readonly logger = createLogger(Tor.name)
  // All hidden-service maps use the onion service ID without the .onion suffix.
  private hiddenServices: Map<string, HiddenServiceData> = new Map()
  private publishedHiddenServices: Map<string, HiddenServiceData> = new Map()
  private hiddenServicePublicationPromises: Map<string, Promise<string>> = new Map()
  private hiddenServiceRetryTimers: Map<string, NodeJS.Timeout> = new Map()
  private hiddenServiceGeneration = 0
  private readonly registeredHiddenServices = new Map<string, HiddenServiceData>()
  private readonly hiddenServiceControllers = new Map<string, AbortController>()
  private readonly hiddenServiceRetryAttempts = new Map<string, number>()
  private bootstrapRestartPromise: Promise<void> | undefined
  private bootstrapStallState: BootstrapStallState | undefined
  private bootstrapGeneration = 0
  public bootstrapped = false
  constructor(
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(TOR_PARAMS_PROVIDER) public readonly torParamsProvider: TorParamsProvider,
    @Inject(TOR_PASSWORD_PROVIDER) public readonly torPasswordProvider: TorPasswordProvider,
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    private readonly torControl: TorControl
  ) {
    super()
    this.controlPort = configOptions.torControlPort
    this.extraTorProcessParams = this.mergeDefaultTorParams(torParamsProvider.extraTorProcessParams)

    this.logger.info('QUIET DIR', this.quietDir)
  }

  async onModuleInit() {
    if (!this.torParamsProvider.torPath) {
      this.startBootstrapWatcher()
      return
    }
    await this.init()
  }

  async onModuleDestroy() {
    this.logger.info('Destroying Tor service...')
    if (this.initTimeout) clearTimeout(this.initTimeout)
    if (this.interval) clearInterval(this.interval)
    this.hiddenServiceGeneration += 1
    this.cancelHiddenServiceWork('Tor service closed')
    for (const retryTimer of this.hiddenServiceRetryTimers.values()) clearTimeout(retryTimer)
    this.hiddenServiceRetryTimers.clear()
    if (this.process) {
      await this.kill()
    }
  }

  public setControlPort = (port: number) => {
    this.controlPort = port
  }

  public rewireNativeTor({
    controlPort,
    httpTunnelPort,
    authCookie,
  }: {
    controlPort: number
    httpTunnelPort: number
    authCookie: string
  }) {
    if (!authCookie) throw new Error('Missing native Tor authentication cookie')
    const isFirstNativeSession = !this.torControl.hasCredentials
    const isSameNativeTorSession =
      Number(this.torControl.torControlParams.port) === controlPort &&
      this.torControl.torControlParams.auth.type === TorControlAuthType.COOKIE &&
      this.torControl.torControlParams.auth.value === authCookie

    this.logger.info('Rewiring native Tor control params', {
      controlPort,
      httpTunnelPort,
      isSameNativeTorSession,
    })
    this.configOptions.torControlPort = controlPort
    this.configOptions.httpTunnelPort = httpTunnelPort
    this.configOptions.torAuthCookie = authCookie
    this.controlPort = controlPort
    this.torControl.updateConnectionParams({
      ...this.torControl.torControlParams,
      port: controlPort,
      auth: { value: authCookie, type: TorControlAuthType.COOKIE },
    })

    if (isSameNativeTorSession) {
      this.logger.info('Native Tor session unchanged; preserving bootstrap and hidden-service state')
      if (!this.bootstrapped && !this.interval) {
        this.startBootstrapWatcher()
      }
      return
    }

    // Initial credentials make queued commands usable; they do not replace a
    // previous session. Preserve their generation so earlier resets still count.
    if (!isFirstNativeSession) this.resetBootstrapState()
    this.startBootstrapWatcher()
  }

  public resetBootstrapState() {
    this.bootstrapGeneration += 1
    this.hiddenServiceGeneration += 1
    this.cancelHiddenServiceWork('Tor session replaced')
    this.registeredHiddenServices.clear()
    for (const retryTimer of this.hiddenServiceRetryTimers.values()) clearTimeout(retryTimer)
    this.hiddenServiceRetryTimers.clear()
    this.bootstrapped = false
    this.bootstrapStallState = undefined
    this.publishedHiddenServices = new Map()
    this.hiddenServicePublicationPromises.clear()
    if (this.initTimeout) {
      clearTimeout(this.initTimeout)
      this.initTimeout = undefined
    }
    this.stopBootstrapWatcher()
  }

  private async markBootstrapped(bootstrapGeneration: number) {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    if (this.bootstrapped) return
    // Tor can make outbound connections now. Publishing our own address enables
    // inbound connections and must not hold the dial queue or admission deadline.
    this.logger.info('Bootstrapping finished!')
    this.bootstrapped = true
    this.bootstrapStallState = undefined
    if (this.initTimeout) {
      clearTimeout(this.initTimeout)
      this.initTimeout = undefined
    }
    this.emit('bootstrapped')
    this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
    void this.spawnHiddenServices(bootstrapGeneration)
  }

  public startBootstrapWatcher(intervalMs = 2500) {
    if (this.bootstrapped) return
    if (!this.torControl.torControlParams.port) {
      this.logger.warn('Cannot start bootstrap watcher without a Tor control port')
      return
    }
    if (this.interval) {
      this.logger.warn('Bootstrap interval already set; clearing before starting a new one')
      this.stopBootstrapWatcher()
    }

    const bootstrapGeneration = this.bootstrapGeneration
    let tickInProgress = false
    let tickCount = 0
    let lastTickStartedAt = 0
    this.logger.info('Starting bootstrap check interval', {
      intervalMs,
      controlPort: this.controlPort,
      socksPort: this.socksPort,
      torPids: this.torDataDirectory ? this.getTorProcessIds() : undefined,
    })

    const watcher = setInterval(() => {
      if (!this.isCurrentBootstrapWatcher(watcher, bootstrapGeneration)) return
      // Native Tor credentials arrive separately from backend startup. Keep
      // watching, but avoid authentication retries until they are available.
      if (!this.torParamsProvider.torPath && process.env.BACKEND === 'mobile' && !this.configOptions.torAuthCookie) {
        return
      }
      if (tickInProgress) {
        this.logger.debug('Bootstrap interval tick skipped (previous still running)', {
          tickCount,
          lastTickStartedAt,
        })
        return
      }

      tickInProgress = true
      tickCount += 1
      lastTickStartedAt = Date.now()

      void (async () => {
        this.logger.info('Checking bootstrap interval', { tickCount })
        const restartedMissingTorProcess = await this.checkManagedTorProcessHealth(bootstrapGeneration)
        if (!this.isCurrentBootstrapWatcher(watcher, bootstrapGeneration)) return
        if (restartedMissingTorProcess) {
          return
        }

        const bootstrapStatus = await this.getBootstrapStatus()
        if (!this.isCurrentBootstrapWatcher(watcher, bootstrapGeneration)) return
        if (bootstrapStatus.done) {
          await this.markBootstrapped(bootstrapGeneration)
          this.stopBootstrapWatcher(watcher)
          return
        }
        await this.checkBootstrapStall(bootstrapStatus, bootstrapGeneration)
      })()
        .catch(e => {
          if (!this.isCurrentBootstrapWatcher(watcher, bootstrapGeneration)) return
          this.logger.error(
            `Bootstrap interval tick failed (tickCount=${tickCount}, startedAt=${lastTickStartedAt})`,
            e
          )
          this.logger.error('Bootstrap interval context', {
            torPids: this.torDataDirectory ? this.getTorProcessIds() : undefined,
            controlPort: this.controlPort,
            socksPort: this.socksPort,
          })
        })
        .finally(() => {
          tickInProgress = false
        })
    }, intervalMs)
    this.interval = watcher
  }

  private isCurrentBootstrapWatcher(watcher: any, bootstrapGeneration: number): boolean {
    return this.interval === watcher && this.bootstrapGeneration === bootstrapGeneration
  }

  private stopBootstrapWatcher(watcher = this.interval) {
    if (this.interval !== watcher) return
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }

  mergeDefaultTorParams = (params: TorParams = {}): TorParams => {
    const defaultParams = {
      '--NumEntryGuards': '3', // See task #1295
    }
    return { ...defaultParams, ...params }
  }

  get torProcessParams(): string[] {
    return Array.from(Object.entries(this.extraTorProcessParams)).flat()
  }

  public async isBootstrappingFinished(): Promise<boolean> {
    if (this.bootstrapped) return true
    const bootstrapGeneration = this.bootstrapGeneration
    const watcher = this.interval
    const bootstrapStatus = await this.getBootstrapStatus()
    if (bootstrapGeneration !== this.bootstrapGeneration) return false
    if (bootstrapStatus.done) {
      await this.markBootstrapped(bootstrapGeneration)
      if (bootstrapGeneration !== this.bootstrapGeneration || !this.bootstrapped) return false
      this.stopBootstrapWatcher(watcher)
      return this.bootstrapped
    }
    return false
  }

  private async getBootstrapStatus(): Promise<BootstrapStatus> {
    this.logger.debug('Checking bootstrap status')
    const output = await this.torControl.sendCommand('GETINFO status/bootstrap-phase')
    return this.parseBootstrapStatus(output.messages[0] ?? '')
  }

  private parseBootstrapStatus(rawMessage: string): BootstrapStatus {
    const progressMatch = rawMessage.match(/BOOTSTRAP PROGRESS=(\d+)/)
    const tagMatch = rawMessage.match(/TAG=([^\s]+)/)
    const warningMatch = rawMessage.match(/WARNING="([^"]+)"/)
    const reasonMatch = rawMessage.match(/REASON=([^\s]+)/)
    const recommendationMatch = rawMessage.match(/RECOMMENDATION=([^\s]+)/)

    const progress = progressMatch ? Number(progressMatch[1]) : undefined
    const tag = tagMatch ? tagMatch[1] : undefined

    return {
      rawMessage,
      // Read from the fields rather than by matching the whole line: the severity
      // and trailing fields vary, and a `done` Tor that failed this comparison
      // would be watched, and restarted, forever.
      done: progress === BOOTSTRAP_DONE_PROGRESS || tag === BOOTSTRAP_DONE_TAG,
      progress,
      tag,
      warning: warningMatch?.[1],
      reason: reasonMatch?.[1],
      recommendation: recommendationMatch?.[1],
    }
  }

  private async checkBootstrapStall(status: BootstrapStatus, bootstrapGeneration: number): Promise<void> {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    if (status.done || status.progress == null) {
      this.bootstrapStallState = undefined
      return
    }

    const checkedAt = Date.now()
    const state = this.bootstrapStallState

    // Any change in reported progress means Tor is doing something, so the clock
    // starts over. A decrease counts too: Tor restarts its own bootstrap on a
    // network change, and a fresh attempt is not a stall. Tor reports progress in
    // finer steps than its notice log, so real movement does show up here.
    if (state == null || status.progress !== state.progress) {
      this.bootstrapStallState = {
        progress: status.progress,
        tag: status.tag,
        lastProgressAt: checkedAt,
        ignorableWarningCount: 0,
        lastSlowLogAt: checkedAt,
      }
      return
    }

    state.tag = status.tag
    if (status.recommendation === BOOTSTRAP_RECOMMENDATION_IGNORE) {
      // Tor is telling us it is retrying and expects to recover - a relay that
      // timed out, say. Counting these toward a restart is how a slow link ends
      // up restarted every 35 seconds, never finishing.
      state.ignorableWarningCount += 1
    }

    const stalledMs = checkedAt - state.lastProgressAt
    if (stalledMs < BOOTSTRAP_NO_PROGRESS_RESTART_MS) {
      if (checkedAt - state.lastSlowLogAt >= BOOTSTRAP_SLOW_LOG_INTERVAL_MS) {
        state.lastSlowLogAt = checkedAt
        this.logger.info('Tor bootstrap has not advanced; still waiting', {
          progress: status.progress,
          tag: status.tag,
          stalledMs,
          restartAfterMs: BOOTSTRAP_NO_PROGRESS_RESTART_MS,
          ignorableWarningCount: state.ignorableWarningCount,
          recommendation: status.recommendation,
        })
      }
      return
    }

    await this.restartAfterBootstrapStall(status, stalledMs, state.ignorableWarningCount, bootstrapGeneration)

    // A restart gives Tor a fresh start, so the next window is measured from here.
    // A live restart resets this state outright; this covers the case where it did
    // not, so a stale clock cannot make the following window expire immediately.
    if (this.bootstrapStallState === state) {
      const restartedAt = Date.now()
      state.lastProgressAt = restartedAt
      state.lastSlowLogAt = restartedAt
    }
  }

  private async checkManagedTorProcessHealth(bootstrapGeneration: number): Promise<boolean> {
    if (bootstrapGeneration !== this.bootstrapGeneration) return false
    if (!this.torParamsProvider.torPath || !this.torDataDirectory || this.bootstrapped) {
      return false
    }

    let torPids: string[]
    try {
      torPids = this.getTorProcessIds()
    } catch (e) {
      this.logger.warn('Unable to check managed Tor process health during bootstrap', e)
      return false
    }

    if (torPids.length > 0) {
      return false
    }

    await this.restartManagedTor(
      'Managed Tor process disappeared during bootstrap; restarting Tor',
      {
        controlPort: this.controlPort,
        socksPort: this.socksPort,
        torPids,
      },
      bootstrapGeneration
    )
    return true
  }

  private async restartAfterBootstrapStall(
    status: BootstrapStatus,
    stalledMs: number,
    ignorableWarningCount: number,
    bootstrapGeneration: number
  ): Promise<void> {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    if (!this.torParamsProvider.torPath) {
      this.logger.warn('Tor bootstrap appears stalled, but Tor is externally managed; waiting for native Tor', {
        progress: status.progress,
        tag: status.tag,
        stalledMs,
        ignorableWarningCount,
        status: status.rawMessage,
      })
      this.bootstrapStallState = undefined
      return
    }

    await this.restartManagedTor(
      'Tor bootstrap made no progress; restarting Tor',
      {
        progress: status.progress,
        tag: status.tag,
        stalledMs,
        ignorableWarningCount,
        controlPort: this.controlPort,
        socksPort: this.socksPort,
        torPids: this.torDataDirectory ? this.getTorProcessIds() : undefined,
        status: status.rawMessage,
      },
      bootstrapGeneration
    )
  }

  private async restartManagedTor(
    reason: string,
    context: Record<string, unknown>,
    bootstrapGeneration: number
  ): Promise<void> {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    if (this.bootstrapRestartPromise) {
      await this.bootstrapRestartPromise
      return
    }

    this.logger.warn(reason, context)

    this.bootstrapRestartPromise = (async () => {
      await this.init()
    })()

    try {
      await this.bootstrapRestartPromise
    } finally {
      this.bootstrapRestartPromise = undefined
    }
  }

  public async init(timeout = 120_000): Promise<void> {
    this.resetBootstrapState()
    if (!this.socksPort) this.socksPort = await getPort()
    this.logger.info('Initializing tor...')

    return await new Promise((resolve, reject) => {
      if (!fs.existsSync(this.quietDir)) {
        this.logger.info("Quiet dir doesn't exist, creating it now")
        fs.mkdirSync(this.quietDir)
      }

      this.torDataDirectory = path.join.apply(null, [this.quietDir, 'TorDataDirectory'])
      this.torPidPath = path.join.apply(null, [this.quietDir, 'torPid.json'])
      let oldTorPid: number | null = null
      if (fs.existsSync(this.torPidPath)) {
        const file = fs.readFileSync(this.torPidPath)
        oldTorPid = Number(file.toString())
        this.logger.info(`${this.torPidPath} exists. Old tor pid: ${oldTorPid}`)
      }

      const bootstrapGeneration = this.bootstrapGeneration
      let torStarted = false
      // Covers a Tor that never reports starting at all: spawnTor only settles once
      // Tor announces itself, so without this nothing would start the watcher. Once
      // Tor has started the watcher owns restarts, because it measures a stall by
      // progress - restarting a Tor that is still advancing throws away everything
      // it has done, which is how bootstrap never finishes (#3564).
      this.initTimeout = setTimeout(() => {
        void (async () => {
          if (bootstrapGeneration !== this.bootstrapGeneration) return
          this.logger.debug('Checking init timeout')
          if (torStarted) {
            this.logger.info('Tor started; leaving further restarts to the bootstrap watcher')
            return
          }
          const bootstrapDone = await this.isBootstrappingFinished()
          if (bootstrapGeneration !== this.bootstrapGeneration) return
          if (!bootstrapDone) {
            this.logger.warn('Tor did not report starting within the init timeout; restarting Tor', { timeout })
            await this.init()
          }
        })().catch(e => {
          this.logger.error('Tor init timeout check failed', e)
        })
      }, timeout)

      const tryToSpawnTor = async () => {
        if (oldTorPid != null) {
          this.clearOldTorProcess(oldTorPid)
        }

        try {
          this.clearHangingTorProcess()
        } catch (e) {
          this.logger.error('Error occured while trying to clear hanging tor processes', e)
        }

        try {
          this.logger.info('Spawning new tor process(es)')
          await this.spawnTor()
          torStarted = true

          this.startBootstrapWatcher()

          this.logger.info(`Spawned tor with pid(s): ${this.getTorProcessIds()}`)

          resolve()
        } catch (e) {
          this.logger.error('Killing tor due to error', e)
          try {
            this.clearHangingTorProcess()
            removeFilesFromDir(this.torDataDirectory)
          } catch (cleanupError) {
            this.logger.error('Error while cleaning up after a failed tor spawn', cleanupError)
          }

          // eslint-disable-next-line
          process.nextTick(runTryToSpawnTor)
        }
      }

      // Neither the first attempt nor a retry is awaited by anyone, so a throw
      // escaping tryToSpawnTor would reject into nothing - and an unhandled
      // rejection shuts the backend down. Report it on this promise instead.
      const runTryToSpawnTor = () => {
        tryToSpawnTor().catch(e => {
          this.logger.error('Failed to spawn tor', e)
          reject(e)
        })
      }

      runTryToSpawnTor()
    })
  }

  public resetHiddenServices() {
    this.hiddenServiceGeneration += 1
    this.cancelHiddenServiceWork('Community hidden services reset')
    this.registeredHiddenServices.clear()
    this.hiddenServices = new Map()
    this.publishedHiddenServices = new Map()
    this.hiddenServicePublicationPromises.clear()
    for (const retryTimer of this.hiddenServiceRetryTimers.values()) clearTimeout(retryTimer)
    this.hiddenServiceRetryTimers.clear()
  }

  private torProcessNameCommand(oldTorPid: string): string {
    const byPlatform = {
      android: `ps -p ${oldTorPid} -o comm=`,
      linux: `ps -p ${oldTorPid} -o comm=`,
      darwin: `ps -c -p ${oldTorPid} -o comm=`,
      win32: `TASKLIST /FI "PID eq ${oldTorPid}"`,
    }
    return byPlatform[process.platform as SupportedPlatform]
  }

  private hangingTorProcessCommand(): string {
    /**
     *  Commands should output hanging tor pid
     */
    const byPlatform = {
      // Toybox's command-name flags differ across Android versions. Match full
      // arguments with -f and exclude the detector shell by its PID instead.
      android: `pgrep -f "${this.torDataDirectory}" | awk -v detector="$$" '$1 != detector'`,
      linux: `pgrep -af "${this.torDataDirectory}" | grep -v pgrep | awk '{print $1}'`,
      darwin: `ps -A | grep "${this.torDataDirectory}" | grep -v grep | awk '{print $1}'`,
      win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${this.torDataDirectory.replace(
        /\\/g,
        '\\\\'
      )}%' and name = 'tor.exe'} | Format-Table ProcessId -HideTableHeaders"`,
    }
    return byPlatform[process.platform as SupportedPlatform]
  }

  public getTorProcessIds(): string[] {
    const torProcessId = childProcess.execSync(this.hangingTorProcessCommand()).toString('utf8').trim()
    if (!torProcessId) return []
    return torProcessId.split('\n') // Spawning with {shell:true} starts 2 processes
  }

  public clearHangingTorProcess() {
    this.logger.info('Attempting to kill hanging tor processes')
    const ids = this.getTorProcessIds()
    if (ids.length === 0) {
      this.logger.info('No tor process(es) found to kill')
      return
    }

    this.logger.info(`Found tor process(es) with pid(s) ${ids}. Killing...`)

    for (const id of ids) {
      try {
        process.kill(Number(id.trim()))
      } catch (e) {
        this.logger.error(`Tried killing hanging tor process with id ${id}. Failed`, e)
      }
    }
  }

  public clearOldTorProcess(oldTorPid: number | null) {
    this.logger.info(`Clearing old tor process ${oldTorPid}`)
    if (!oldTorPid) return
    try {
      const stdout = childProcess.execSync(this.torProcessNameCommand(oldTorPid.toString()), {
        encoding: 'utf-8',
      })
      if (stdout.trim() === 'tor' || stdout.search('tor.exe') !== -1) {
        this.logger.info(`Killing old tor, pid: ${oldTorPid}`)
        try {
          process.kill(oldTorPid, 'SIGTERM')
        } catch (e) {
          this.logger.error(`Tried killing old tor process. Failed.`, e)
        }
      } else {
        this.logger.info(`Deleting ${this.torPidPath}`)
        fs.unlinkSync(this.torPidPath)
      }
    } catch (e) {
      this.logger.error(`Error while killing old tor process with PID ${oldTorPid}`, e)
    }
  }

  protected async spawnTor(): Promise<void> {
    this.logger.info('Spawning tor')
    return await new Promise((resolve, reject) => {
      if (!this.configOptions.httpTunnelPort) {
        this.logger.error("Can't spawn tor - no httpTunnelPort")

        reject(new Error("Can't spawn tor - no httpTunnelPort"))
        return
      }
      if (!this.controlPort) {
        this.logger.error("Can't spawn tor - no controlPort")

        reject(new Error("Can't spawn tor - no controlPort"))
        return
      }
      const options: childProcess.SpawnOptionsWithoutStdio = {
        ...this.torParamsProvider.options,
        shell: true,
      }

      this.process = childProcess.spawn(
        this.torParamsProvider.torPath,
        [
          '--SocksPort',
          this.socksPort.toString(),
          '--HTTPTunnelPort',
          this.configOptions.httpTunnelPort?.toString(),
          '--ControlPort',
          this.controlPort.toString(),
          '--PidFile',
          `"${this.torPidPath}"`,
          '--DataDirectory',
          `"${this.torDataDirectory}"`,
          '--HashedControlPassword',
          this.torPasswordProvider.torHashedPassword,
          ...this.torProcessParams,
        ],
        options
      )

      this.process.on('exit', (code, signal) => {
        this.logger.info(`Tor exited with code ${code} and signal ${signal}`)
      })

      this.process.on('error', err => {
        // errors come in as byte arrays so we want them to be readable
        const data = isUint8Array(err)
          ? uint8ArrayToString(err)
          : (err as any).type === 'buffer'
            ? uint8ArrayToString((err as any).data)
            : err
        this.logger.error(`Tor process. Error occurred`, data)
      })

      this.process.stdout.on('data', (data: any) => {
        const bootstrappedRegexp = /Bootstrapped 0/
        // TODO: Figure out if there's a way to get this working in tests
        // const bootstrappedRegexp = /Loaded enough directory info to build circuits/
        if (!bootstrappedRegexp.test(data.toString())) return

        // The bootstrap watcher publishes registered services once Tor can use
        // the network. Process startup itself never waits for publication.
        resolve()
      })
    })
  }

  public async spawnHiddenServices(bootstrapGeneration = this.bootstrapGeneration) {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    this.logger.info(`Spawning hidden service(s) (count: ${this.hiddenServices.size})`)
    await Promise.all(Array.from(this.hiddenServices.values(), service => this.publishRegisteredHiddenService(service)))
  }

  private cancelHiddenServiceWork(reason: string) {
    for (const controller of this.hiddenServiceControllers.values()) controller.abort(new Error(reason))
    this.hiddenServiceControllers.clear()
    this.hiddenServiceRetryAttempts.clear()
  }

  private recordHiddenService({ onionAddress, virtPort = 80, ...params }: SpawnHiddenServiceParams): HiddenServiceData {
    onionAddress = onionAddress.replace(/\.onion$/, '')
    const current = this.hiddenServices.get(onionAddress)
    if (
      current?.privKey === params.privKey &&
      current.targetPort === params.targetPort &&
      current.virtPort === virtPort
    ) {
      return current
    }
    // Replacing a port/key invalidates both the observer and Tor's old binding.
    this.forgetHiddenService(onionAddress)
    const service = { ...params, onionAddress, virtPort }
    this.hiddenServices.set(onionAddress, service)
    return service
  }

  private forgetHiddenService(onionAddress: string) {
    this.hiddenServices.delete(onionAddress)
    this.hiddenServiceControllers.get(onionAddress)?.abort(new Error('Hidden service registration replaced'))
    this.hiddenServiceControllers.delete(onionAddress)
    this.hiddenServicePublicationPromises.delete(onionAddress)
    this.registeredHiddenServices.delete(onionAddress)
    this.publishedHiddenServices.delete(onionAddress)
    const retryTimer = this.hiddenServiceRetryTimers.get(onionAddress)
    if (retryTimer) clearTimeout(retryTimer)
    this.hiddenServiceRetryTimers.delete(onionAddress)
    this.hiddenServiceRetryAttempts.delete(onionAddress)
  }

  /** All community launches record intent; network publication never gates them. */
  public async registerHiddenService(params: HiddenServiceData): Promise<void> {
    const service = this.recordHiddenService(params)
    if (this.bootstrapped) void this.publishRegisteredHiddenService(service)
  }

  private async publishRegisteredHiddenService(service: HiddenServiceData): Promise<void> {
    const { onionAddress } = service
    const inFlight = this.hiddenServicePublicationPromises.get(onionAddress)
    if (inFlight)
      return await inFlight.then(
        () => undefined,
        () => undefined
      )
    if (this.publishedHiddenServices.has(onionAddress)) return
    const generation = this.hiddenServiceGeneration
    const slowPublication = setTimeout(() => {
      this.logger.warn('Hidden service descriptor publication is slow; outbound connections remain available')
    }, TOR_EVENT_TIMEOUT_MS)
    try {
      await this.waitForHiddenServicePublication(service, null)
      this.hiddenServiceRetryAttempts.delete(onionAddress)
    } catch (error) {
      if (generation !== this.hiddenServiceGeneration || this.hiddenServices.get(onionAddress) !== service) return
      const message = error instanceof Error ? error.message : String(error)
      // Invalid commands/keys need a new configuration. Connectivity failures
      // remain recoverable, with capped backoff instead of a rapid collision loop.
      if (/^5\d\d\b/.test(message) && !/^550 Onion address collision\b/.test(message)) {
        this.logger.error('Hidden service registration rejected by Tor; waiting for corrected configuration', error)
        return
      }
      if (!this.hiddenServiceRetryTimers.has(onionAddress)) {
        const attempt = this.hiddenServiceRetryAttempts.get(onionAddress) ?? 0
        const retryMs = Math.min(2500 * 2 ** Math.min(attempt, 4), 30_000)
        this.hiddenServiceRetryAttempts.set(onionAddress, attempt + 1)
        this.logger.warn('Hidden service observation interrupted; retrying', { retryMs, error })
        const retryTimer = setTimeout(() => {
          this.hiddenServiceRetryTimers.delete(onionAddress)
          if (generation !== this.hiddenServiceGeneration || this.hiddenServices.get(onionAddress) !== service) return
          if (this.bootstrapped) void this.publishRegisteredHiddenService(service)
        }, retryMs)
        this.hiddenServiceRetryTimers.set(onionAddress, retryTimer)
      }
    } finally {
      clearTimeout(slowPublication)
    }
  }

  private async ensureHiddenServiceRegistered(service: HiddenServiceData, signal: AbortSignal) {
    const { onionAddress, privKey, targetPort, virtPort } = service
    const detached = await this.torControl.getDetachedOnionServices(signal)
    signal.throwIfAborted()
    if (detached.has(onionAddress)) {
      if (this.registeredHiddenServices.get(onionAddress) === service) {
        // Losing the event socket doesn't undo ADD_ONION. Resume observing the
        // same service; Tor continues its publication attempts independently.
        return { code: 250, messages: [`250-ServiceID=${onionAddress}`, '250 OK'] }
      }
      // A lost ADD reply, old application version, or replaced Tor session may
      // leave a detached service with an unknown target port. Rebind it once.
      await this.torControl.sendCommand(`DEL_ONION ${onionAddress}`, signal)
      signal.throwIfAborted()
    }
    this.registeredHiddenServices.delete(onionAddress)
    this.publishedHiddenServices.delete(onionAddress)
    const response = await this.torControl.sendCommand(
      `ADD_ONION ${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`,
      signal
    )
    signal.throwIfAborted()
    const acceptedAddress = response.messages.find(line => line.startsWith('250-ServiceID='))?.slice(14)
    if (acceptedAddress !== onionAddress)
      throw new Error('Registered hidden-service address does not match the requested address')
    // Record acceptance before waiting for any descriptor event.
    this.registeredHiddenServices.set(onionAddress, service)
    return response
  }

  /** Explicit reachability wait for callers that need it (e.g. Tor integration tests). */
  public async waitForHiddenServicePublication(
    params: SpawnHiddenServiceParams,
    publicationTimeoutMs?: number | null
  ): Promise<string> {
    const service = this.recordHiddenService(params)
    const { onionAddress } = service
    if (this.publishedHiddenServices.has(onionAddress)) return `${onionAddress}.onion`
    const inFlight = this.hiddenServicePublicationPromises.get(onionAddress)
    if (inFlight) return await inFlight

    const generation = this.hiddenServiceGeneration
    const controller = new AbortController()
    this.hiddenServiceControllers.set(onionAddress, controller)
    const initializationPromise = (async () => {
      await this.torControl.waitForEventAfter(
        () => this.ensureHiddenServiceRegistered(service, controller.signal),
        HIDDEN_SERVICE_DESCRIPTOR_EVENT,
        event => this.isHiddenServiceDescriptorUploaded(event, onionAddress),
        publicationTimeoutMs,
        controller.signal
      )
      if (generation !== this.hiddenServiceGeneration || this.hiddenServices.get(onionAddress) !== service) {
        throw new Error('Tor generation changed while initializing hidden service')
      }
      this.logger.debug(`Published hidden service descriptor for onion address ${onionAddress}`)
      this.publishedHiddenServices.set(onionAddress, service)
      return `${onionAddress}.onion`
    })()
    this.hiddenServicePublicationPromises.set(onionAddress, initializationPromise)
    try {
      return await initializationPromise
    } finally {
      if (this.hiddenServicePublicationPromises.get(onionAddress) === initializationPromise) {
        this.hiddenServicePublicationPromises.delete(onionAddress)
        this.hiddenServiceControllers.delete(onionAddress)
      }
    }
  }

  public async destroyHiddenService(serviceId: string): Promise<boolean> {
    serviceId = serviceId.replace(/\.onion$/, '')
    // Cancel before DEL_ONION so a late upload cannot resurrect the registration.
    this.forgetHiddenService(serviceId)
    try {
      await this.torControl.sendCommand(`DEL_ONION ${serviceId}`)
      return true
    } catch (err) {
      this.logger.error(`Couldn't destroy hidden service ${serviceId}`, err)
      return false
    }
  }

  private isHiddenServiceDescriptorUploaded(event: string, onionAddress: string): boolean {
    const [, eventCode, action, serviceId] = event.trim().split(/\s+/)
    return (
      eventCode === HIDDEN_SERVICE_DESCRIPTOR_EVENT &&
      action === 'UPLOADED' &&
      serviceId?.replace(/\.onion$/, '') === onionAddress.replace(/\.onion$/, '')
    )
  }

  public async switchToCleanCircuts() {
    try {
      this.logger.info('Sending newnym')
      const response = await this.torControl.sendCommand('SIGNAL NEWNYM')
      this.logger.info('Newnym response', response)
    } catch (e) {
      this.logger.error('Could not send newnym', e)
    }
  }

  public async getInfo(getInfoTarget: GetInfoTorSignal) {
    try {
      const response = await this.torControl.sendCommand(`GETINFO ${getInfoTarget}`)
      this.logger.debug('GETINFO', getInfoTarget, response)
    } catch (e) {
      this.logger.error('Could not get info', getInfoTarget, e)
    }
  }

  public async kill(): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.logger.info('Killing tor... with pid', this.process?.pid)
      if (this.process === null) {
        this.logger.warn('TOR: Process is not initalized.')
        resolve()
        return
      }
      this.resetBootstrapState()
      if (this.initTimeout) clearTimeout(this.initTimeout)
      if (this.interval) clearInterval(this.interval)
      this.process?.on('close', () => {
        this.process = null
        resolve()
        return
      })
      this.process?.on('error', () => {
        reject(new Error('TOR: Something went wrong with killing tor process'))
      })
      this.clearHangingTorProcess()
    })
  }
}
