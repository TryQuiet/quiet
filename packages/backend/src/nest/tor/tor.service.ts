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
import { TorControl } from './tor-control.service'
import {
  type BootstrapStallState,
  type BootstrapStatus,
  GetInfoTorSignal,
  HiddenServiceData,
  type SpawnHiddenServiceParams,
  TorControlAuthType,
  type TorControlResponse,
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
  private initializedHiddenServices: Map<string, HiddenServiceData> = new Map()
  private hiddenServiceInitializationPromises: Map<string, Promise<string>> = new Map()
  private hiddenServiceRetryTimers: Map<string, NodeJS.Timeout> = new Map()
  private hiddenServiceGeneration = 0
  private markBootstrappedPromise: Promise<void> | undefined
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
    for (const retryTimer of this.hiddenServiceRetryTimers.values()) clearTimeout(retryTimer)
    this.hiddenServiceRetryTimers.clear()
    this.bootstrapped = false
    this.bootstrapStallState = undefined
    this.initializedHiddenServices = new Map()
    this.hiddenServiceInitializationPromises.clear()
    this.markBootstrappedPromise = undefined
    if (this.initTimeout) {
      clearTimeout(this.initTimeout)
      this.initTimeout = undefined
    }
    this.stopBootstrapWatcher()
  }

  private async markBootstrapped(bootstrapGeneration: number) {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    if (this.bootstrapped) return
    if (this.markBootstrappedPromise) {
      await this.markBootstrappedPromise
      return
    }

    const markBootstrappedPromise = (async () => {
      await this.spawnHiddenServices(bootstrapGeneration)
      // The generation can change while hidden-service initialization is in flight,
      // so revalidate before publishing bootstrapped state for the session.
      if (bootstrapGeneration !== this.bootstrapGeneration) {
        this.logger.warn('Bootstrap generation changed while marking Tor bootstrapped, skipping stale event')
        return
      }

      // A registration can arrive while publication is in flight. Drain until
      // every desired service belongs to this Tor session, then mark the
      // session ready synchronously so later registrations publish directly.
      while ([...this.hiddenServices.keys()].some(onionAddress => !this.initializedHiddenServices.has(onionAddress))) {
        await this.spawnHiddenServices(bootstrapGeneration)
        if (bootstrapGeneration !== this.bootstrapGeneration) return
      }
      this.logger.info('Bootstrapping finished!')
      this.bootstrapped = true
      this.bootstrapStallState = undefined
      if (this.initTimeout) {
        clearTimeout(this.initTimeout)
        this.initTimeout = undefined
      }
      this.emit('bootstrapped')
      this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
    })()

    this.markBootstrappedPromise = markBootstrappedPromise
    try {
      await markBootstrappedPromise
    } finally {
      if (this.markBootstrappedPromise === markBootstrappedPromise) {
        this.markBootstrappedPromise = undefined
      }
    }
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
    this.hiddenServices = new Map()
    this.initializedHiddenServices = new Map()
    this.hiddenServiceInitializationPromises.clear()
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

        // Publishing is started here so a descriptor goes up as early as Tor allows,
        // but it is deliberately not awaited. A Tor at 0% bootstrap cannot upload a
        // descriptor yet, so awaiting the HS_DESC wait held this promise - and with
        // it init() - for the whole event timeout, and the next restart tore the
        // control connection down underneath it. That rejection surfaced in a
        // listener nobody awaits, which the backend turns into a full app shutdown.
        // Publication is retried by the bootstrap watcher and by registerHiddenService.
        void this.spawnHiddenServices().catch(e => {
          this.logger.error('Failed to publish hidden services for the new Tor session', e)
        })
        resolve()
      })
    })
  }

  public async spawnHiddenServices(bootstrapGeneration = this.bootstrapGeneration) {
    if (bootstrapGeneration !== this.bootstrapGeneration) return
    this.logger.info(`Spawning hidden service(s) (count: ${this.hiddenServices.size})`)
    for (const el of Array.from(this.hiddenServices.values())) {
      await this.spawnHiddenService(el)
      if (bootstrapGeneration !== this.bootstrapGeneration) return
    }
  }

  /**
   * Records a hidden service before Tor is available. The bootstrap watcher
   * publishes all registered services when the current Tor session is ready.
   */
  public async registerHiddenService({
    targetPort,
    privKey,
    onionAddress,
    virtPort,
  }: HiddenServiceData): Promise<void> {
    onionAddress = onionAddress.replace(/\.onion$/, '')
    this.hiddenServices.set(onionAddress, { targetPort, privKey, virtPort, onionAddress })

    if (this.bootstrapped) {
      const registrationGeneration = this.hiddenServiceGeneration
      try {
        await this.spawnHiddenService({ targetPort, privKey, virtPort, onionAddress })
      } catch (error) {
        this.logger.error('Failed to publish registered hidden service', error)
        if (
          registrationGeneration === this.hiddenServiceGeneration &&
          !this.hiddenServiceRetryTimers.has(onionAddress)
        ) {
          const retryTimer = setTimeout(() => {
            this.hiddenServiceRetryTimers.delete(onionAddress)
            if (registrationGeneration !== this.hiddenServiceGeneration) return
            const registered = this.hiddenServices.get(onionAddress)
            if (!registered || !this.bootstrapped) return
            void this.registerHiddenService(registered).catch(retryError => {
              this.logger.error('Failed to retry registered hidden-service publication', retryError)
            })
          }, 2500)
          this.hiddenServiceRetryTimers.set(onionAddress, retryTimer)
        }
        throw error
      }
    }
  }

  public async spawnHiddenService({
    targetPort,
    privKey,
    onionAddress,
    virtPort = 80,
  }: SpawnHiddenServiceParams): Promise<string> {
    onionAddress = onionAddress.replace(/\.onion$/, '')
    this.logger.info(`Spawning Tor hidden service`)
    const initializedHiddenService = this.initializedHiddenServices.get(onionAddress)
    if (initializedHiddenService) {
      this.logger.warn(`Hidden service already initialized for ${initializedHiddenService.onionAddress}`)
      return `${initializedHiddenService.onionAddress}.onion`
    }

    const initializationInFlight = this.hiddenServiceInitializationPromises.get(onionAddress)
    if (initializationInFlight) return await initializationInFlight

    const hiddenServiceGeneration = this.hiddenServiceGeneration
    const initializationPromise = (async () => {
      const publish = async (attempt = 0): Promise<TorControlResponse> => {
        let accepted = false
        try {
          return await this.torControl.sendCommandAndWaitForEvent(
            `ADD_ONION ${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`,
            HIDDEN_SERVICE_DESCRIPTOR_EVENT,
            event => this.isHiddenServiceDescriptorUploaded(event, onionAddress),
            undefined,
            response => {
              accepted = response.messages[0] === `250-ServiceID=${onionAddress}`
            }
          )
        } catch (error) {
          if (!accepted || hiddenServiceGeneration !== this.hiddenServiceGeneration) throw error
          // ADD_ONION succeeded even though publication did not. Leaving its
          // detached service alive makes every later retry collide with it.
          // Only remove the exact service accepted in this same Tor session.
          await this.torControl.sendCommand(`DEL_ONION ${onionAddress}`)
          if (attempt !== 0 || hiddenServiceGeneration !== this.hiddenServiceGeneration) throw error
          this.logger.warn('Retrying hidden-service publication after removing the unpublished service')
          return await publish(attempt + 1)
        }
      }
      const status = await publish()
      if (hiddenServiceGeneration !== this.hiddenServiceGeneration) {
        throw new Error('Tor generation changed while initializing hidden service')
      }

      const publishedAddress = status.messages[0].replace('250-ServiceID=', '').replace(/\.onion$/, '')
      if (publishedAddress !== onionAddress) {
        throw new Error('Published hidden-service address does not match the requested address')
      }
      this.logger.debug(`Published hidden service descriptor for onion address ${onionAddress}`)

      const hiddenService: HiddenServiceData = { targetPort, privKey, virtPort, onionAddress }
      this.hiddenServices.set(onionAddress, hiddenService)
      this.initializedHiddenServices.set(onionAddress, hiddenService)
      return `${onionAddress}.onion`
    })()

    this.hiddenServiceInitializationPromises.set(onionAddress, initializationPromise)
    try {
      return await initializationPromise
    } finally {
      if (this.hiddenServiceInitializationPromises.get(onionAddress) === initializationPromise) {
        this.hiddenServiceInitializationPromises.delete(onionAddress)
      }
    }
  }

  public async destroyHiddenService(serviceId: string): Promise<boolean> {
    serviceId = serviceId.replace(/\.onion$/, '')
    try {
      await this.torControl.sendCommand(`DEL_ONION ${serviceId}`)
      this.hiddenServices.delete(serviceId)
      this.initializedHiddenServices.delete(serviceId)
      const retryTimer = this.hiddenServiceRetryTimers.get(serviceId)
      if (retryTimer) clearTimeout(retryTimer)
      this.hiddenServiceRetryTimers.delete(serviceId)
      return true
    } catch (err) {
      // A timeout can mean Tor removed the service but its response was lost.
      this.initializedHiddenServices.delete(serviceId)
      this.logger.error(`Couldn't destroy hidden service ${serviceId}`, err)
      return false
    }
  }

  /**
   * Create a hidden service and return its address and key.
   *
   * Tor mints the keypair itself and answers ADD_ONION with it immediately, with no
   * network involved. Publishing the descriptor is the part that needs a bootstrapped
   * Tor, so `waitForDescriptorUpload` is what a caller that only wants the key can
   * turn off: it then returns as soon as Tor has answered, whatever bootstrap is
   * doing. A caller that needs the service to be reachable leaves it on.
   */
  public async createNewHiddenService({
    targetPort,
    virtPort = 80,
    waitForDescriptorUpload = true,
  }: {
    targetPort: number
    virtPort?: number
    waitForDescriptorUpload?: boolean
  }): Promise<{ onionAddress: string; privateKey: string }> {
    const hiddenServiceGeneration = this.hiddenServiceGeneration
    const command = `ADD_ONION NEW:BEST Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    const status = waitForDescriptorUpload
      ? await this.torControl.sendCommandAndWaitForEvent(
          command,
          HIDDEN_SERVICE_DESCRIPTOR_EVENT,
          (event, response) => {
            const generatedAddress = response.messages[0].replace('250-ServiceID=', '').replace(/\.onion$/, '')
            return this.isHiddenServiceDescriptorUploaded(event, generatedAddress)
          }
        )
      : await this.torControl.sendCommand(command)

    if (hiddenServiceGeneration !== this.hiddenServiceGeneration) {
      throw new Error('Tor generation changed while creating hidden service')
    }
    const onionAddress = status.messages[0].replace('250-ServiceID=', '').replace(/\.onion$/, '')
    const privateKey = status.messages[1].replace('250-PrivateKey=', '')
    const hiddenService: HiddenServiceData = { targetPort, privKey: privateKey, virtPort, onionAddress }
    this.hiddenServices.set(onionAddress, hiddenService)
    // Only a published descriptor makes the service reachable, so an unpublished one
    // is not recorded as initialized: it would otherwise be skipped when the session
    // spawns its hidden services.
    if (waitForDescriptorUpload) {
      this.initializedHiddenServices.set(onionAddress, hiddenService)
    }

    return {
      onionAddress: `${onionAddress}.onion`,
      privateKey,
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
