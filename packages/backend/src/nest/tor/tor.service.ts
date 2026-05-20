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
  GetInfoTorSignal,
  HiddenServiceData,
  TorControlAuthType,
  TorParams,
  TorParamsProvider,
  TorPasswordProvider,
} from './tor.types'

import { createLogger } from '../common/logger'
import { toString as uint8ArrayToString } from 'uint8arrays'
import { isUint8Array } from 'util/types'

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
  private hiddenServices: Map<string, HiddenServiceData> = new Map()
  private initializedHiddenServices: Map<string, HiddenServiceData> = new Map()
  private markBootstrappedPromise: Promise<void> | undefined
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
    this.logger.info('Rewiring native Tor control params', { controlPort, httpTunnelPort })
    this.configOptions.torControlPort = controlPort
    this.configOptions.httpTunnelPort = httpTunnelPort
    this.controlPort = controlPort
    this.torControl.torControlParams.port = controlPort
    this.torControl.torControlParams.auth.value = authCookie
    this.torControl.torControlParams.auth.type = TorControlAuthType.COOKIE
    this.resetBootstrapState()
    this.startBootstrapWatcher()
  }

  public resetBootstrapState() {
    this.bootstrapGeneration += 1
    this.bootstrapped = false
    this.initializedHiddenServices = new Map()
    this.markBootstrappedPromise = undefined
    this.stopBootstrapWatcher()
  }

  private async markBootstrapped() {
    if (this.bootstrapped) return
    if (this.markBootstrappedPromise) {
      await this.markBootstrappedPromise
      return
    }

    const bootstrapGeneration = this.bootstrapGeneration
    const markBootstrappedPromise = (async () => {
      await this.spawnHiddenServices()
      if (bootstrapGeneration !== this.bootstrapGeneration) {
        this.logger.warn('Bootstrap generation changed while marking Tor bootstrapped, skipping stale event')
        return
      }

      this.logger.info('Bootstrapping finished!')
      this.bootstrapped = true
      this.emit('bootstrapped')
      this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
      this.stopBootstrapWatcher()
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

    let tickInProgress = false
    let tickCount = 0
    let lastTickStartedAt = 0
    this.logger.info('Starting bootstrap check interval', {
      intervalMs,
      controlPort: this.controlPort,
      socksPort: this.socksPort,
      torPids: this.torDataDirectory ? this.getTorProcessIds() : undefined,
    })

    this.interval = setInterval(() => {
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
        const bootstrapDone = await this.isBootstrappingFinished()
        if (bootstrapDone) {
          this.stopBootstrapWatcher()
        }
      })()
        .catch(e => {
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
  }

  private stopBootstrapWatcher() {
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
    this.logger.debug('Checking bootstrap status')
    const output = await this.torControl.sendCommand('GETINFO status/bootstrap-phase')
    if (output.messages[0] === '250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"') {
      await this.markBootstrapped()
      return true
    }
    return false
  }

  public async init(timeout = 120_000): Promise<void> {
    if (!this.socksPort) this.socksPort = await getPort()
    this.logger.info('Initializing tor...')
    this.resetBootstrapState()

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

      this.initTimeout = setTimeout(async () => {
        this.logger.debug('Checking init timeout')
        const bootstrapDone = await this.isBootstrappingFinished()
        if (!bootstrapDone) {
          this.initializedHiddenServices = new Map()
          clearInterval(this.interval)
          await this.init()
        }
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

          this.startBootstrapWatcher()

          this.logger.info(`Spawned tor with pid(s): ${this.getTorProcessIds()}`)

          resolve()
        } catch (e) {
          this.logger.error('Killing tor due to error', e)
          this.clearHangingTorProcess()
          removeFilesFromDir(this.torDataDirectory)

          // eslint-disable-next-line
          process.nextTick(tryToSpawnTor)
        }
      }

      tryToSpawnTor()
    })
  }

  public resetHiddenServices() {
    this.hiddenServices = new Map()
    this.initializedHiddenServices = new Map()
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
      android: `pgrep -af "${this.torDataDirectory}" | grep -v pgrep | awk '{print $1}'`,
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
          // ...this.torProcessParams
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

      this.process.stdout.on('data', async (data: any) => {
        const bootstrappedRegexp = /Bootstrapped 0/
        // TODO: Figure out if there's a way to get this working in tests
        // const bootstrappedRegexp = /Loaded enough directory info to build circuits/
        if (bootstrappedRegexp.test(data.toString())) {
          await this.spawnHiddenServices()
          resolve()
        }
      })
    })
  }

  public async spawnHiddenServices() {
    this.logger.info(`Spawning hidden service(s) (count: ${this.hiddenServices.size})`)
    for (const el of Array.from(this.hiddenServices.values())) {
      await this.spawnHiddenService(el)
    }
  }

  public async spawnHiddenService({
    targetPort,
    privKey,
    virtPort = 80,
  }: {
    targetPort: number
    privKey: string
    virtPort?: number
  }): Promise<string> {
    this.logger.info(`Spawning Tor hidden service`)
    const initializedHiddenService = this.initializedHiddenServices.get(privKey)
    if (initializedHiddenService) {
      this.logger.warn(`Hidden service already initialized for ${initializedHiddenService.onionAddress}`)
      return initializedHiddenService.onionAddress
    }
    const status = await this.torControl.sendCommand(
      `ADD_ONION ${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )
    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    this.logger.debug(`Spawned hidden service with onion address ${onionAddress}`)

    const hiddenService: HiddenServiceData = { targetPort, privKey, virtPort, onionAddress }
    this.hiddenServices.set(privKey, hiddenService)
    this.initializedHiddenServices.set(privKey, hiddenService)
    return `${onionAddress}.onion`
  }

  public async destroyHiddenService(serviceId: string): Promise<boolean> {
    try {
      await this.torControl.sendCommand(`DEL_ONION ${serviceId}`)
      this.hiddenServices.delete(serviceId)
      return true
    } catch (err) {
      this.logger.error(`Couldn't destroy hidden service ${serviceId}`, err)
      return false
    }
  }

  public async createNewHiddenService({
    targetPort,
    virtPort = 80,
  }: {
    targetPort: number
    virtPort?: number
  }): Promise<{ onionAddress: string; privateKey: string }> {
    const status = await this.torControl.sendCommand(
      `ADD_ONION NEW:BEST Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )

    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    const privateKey = status.messages[1].replace('250-PrivateKey=', '')
    const hiddenService: HiddenServiceData = { targetPort, privKey: privateKey, virtPort, onionAddress }
    this.hiddenServices.set(onionAddress, hiddenService)

    return {
      onionAddress: `${onionAddress}.onion`,
      privateKey,
    }
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
    this.resetBootstrapState()
    return await new Promise((resolve, reject) => {
      this.logger.info('Killing tor... with pid', this.process?.pid)
      if (this.process === null) {
        this.logger.warn('TOR: Process is not initalized.')
        resolve()
        return
      }
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
