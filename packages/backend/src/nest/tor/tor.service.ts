import * as child_process from 'child_process'
import crypto from 'crypto'
import * as fs from 'fs'
import path from 'path'
import getPort from 'get-port'
import { removeFilesFromDir } from '../common/utils'
import { EventEmitter } from 'events'
import { SocketActionTypes, SupportedPlatform } from '@quiet/types'
import { Inject, OnModuleInit } from '@nestjs/common'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { TorControl } from './tor-control.service'
import { GetInfoTorSignal, TorParams, TorParamsProvider, TorPasswordProvider } from './tor.types'

import Logger from '../common/logger'
import { sleep } from '../common/sleep'

export class Tor extends EventEmitter implements OnModuleInit {
  socksPort: number
  process: child_process.ChildProcessWithoutNullStreams | any = null
  torDataDirectory: string
  torPidPath: string
  extraTorProcessParams: TorParams
  controlPort: number | undefined
  private readonly logger = Logger(Tor.name)
  private hiddenServices: Map<string, string> = new Map()
  private initializedHiddenServices: Map<string, string> = new Map()
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

    console.log('QUIRT DIR', this.quietDir)
  }

  async onModuleInit() {
    if (!this.torParamsProvider.torPath) return
    await this.init()
    console.log('----------------------------------------------------------tor initialized')
  }

  public setControlPort = (port: number) => {
    this.controlPort = port
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
  public async init({ repeat = 6, timeout = 3600_000 } = {}): Promise<void> {
    this.logger('Initializing tor...')
    console.log('this.controlPort', this.controlPort)
    console.log('this.torControl', this.torControl.torControlParams)
    console.log('configOptions.torControl', this.configOptions.torControlPort)
    this.socksPort = await getPort()
    return await new Promise((resolve, reject) => {
      if (this.process) {
        throw new Error('Tor already initialized')
      }

      if (!fs.existsSync(this.quietDir)) {
        fs.mkdirSync(this.quietDir)
      }

      this.torDataDirectory = path.join.apply(null, [this.quietDir, 'TorDataDirectory'])
      console.log('this.torDataDirectory', this.torDataDirectory)
      this.torPidPath = path.join.apply(null, [this.quietDir, 'torPid.json'])
      let oldTorPid: number | null = null
      if (fs.existsSync(this.torPidPath)) {
        const file = fs.readFileSync(this.torPidPath)
        oldTorPid = Number(file.toString())
        this.logger(`${this.torPidPath} exists. Old tor pid: ${oldTorPid}`)
      }
      let counter = 0
      console.log(2)
      const tryToSpawnTor = async () => {
        this.logger(`Trying to spawn tor for the ${counter} time...`)
        if (counter > repeat) {
          reject(new Error(`Failed to spawn tor ${counter} times`))
          return
        }

        this.clearOldTorProcess(oldTorPid)

        try {
          this.clearHangingTorProcess()
        } catch (e) {
          this.logger('Error occured while trying to clear hanging tor processes')
        }

        try {
          await this.spawnTor(timeout)
          resolve()
        } catch {
          this.logger('Killing tor')
          await this.process.kill()
          removeFilesFromDir(this.torDataDirectory)
          counter++

          // eslint-disable-next-line
          process.nextTick(tryToSpawnTor)
        }
      }
      // setTimeout(this.checkTorBootstrap, 60000)
      // eslint-disable-next-line
      tryToSpawnTor()
    })
  }

  // private checkTorBootstrap() {
  //   this.sendCommand(checktorbootstrap)
  // }

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

  public clearHangingTorProcess() {
    const torProcessId = child_process.execSync(this.hangingTorProcessCommand()).toString('utf8').trim()
    if (!torProcessId) return
    this.logger(`Found tor process with pid ${torProcessId}. Killing...`)
    try {
      process.kill(Number(torProcessId), 'SIGTERM')
    } catch (e) {
      this.logger.error(`Tried killing hanging tor process. Failed. Reason: ${e.message}`)
    }
  }

  public clearOldTorProcess(oldTorPid: number | null) {
    if (!oldTorPid) return
    child_process.exec(
      this.torProcessNameCommand(oldTorPid.toString()),
      (err: child_process.ExecException | null, stdout: string, _stderr: string) => {
        if (err) {
          this.logger.error(err)
        }
        if (stdout.trim() === 'tor' || stdout.search('tor.exe') !== -1) {
          this.logger(`Killing old tor, pid: ${oldTorPid}`)
          try {
            process.kill(oldTorPid, 'SIGTERM')
          } catch (e) {
            this.logger.error(`Tried killing old tor process. Failed. Reason: ${e.message}`)
          }
        } else {
          this.logger(`Deleting ${this.torPidPath}`)
          fs.unlinkSync(this.torPidPath)
        }
      }
    )
  }

  protected async spawnTor(timeoutMs: number): Promise<void> {
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

      console.log([
        '--SocksPort',
        this.socksPort.toString(),
        '--HTTPTunnelPort',
        this.configOptions.httpTunnelPort?.toString(),
        '--ControlPort',
        this.controlPort.toString(),
        '--PidFile',
        this.torPidPath,
        '--DataDirectory',
        this.torDataDirectory,
        '--HashedControlPassword',
        this.torPasswordProvider.torHashedPassword,
        // ...this.torProcessParams
      ])
      this.process = child_process.spawn(
        this.torParamsProvider.torPath,
        [
          '--SocksPort',
          this.socksPort.toString(),
          '--HTTPTunnelPort',
          this.configOptions.httpTunnelPort?.toString(),
          '--ControlPort',
          this.controlPort.toString(),
          '--PidFile',
          this.torPidPath,
          '--DataDirectory',
          this.torDataDirectory,
          '--HashedControlPassword',
          this.torPasswordProvider.torHashedPassword,
          // ...this.torProcessParams
        ],
        this.torParamsProvider.options
      )

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout of ${timeoutMs / 1000} while waiting for tor to bootstrap`))
      }, timeoutMs)

      // this.socketService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
      //   this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
      // })

      this.process.stdout.on('data', (data: any) => {
        this.logger(data.toString())
        this.serverIoProvider.io.emit(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, data.toString())
        const regexp = /Bootstrapped 0/
        if (regexp.test(data.toString())) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })
  }

  public async spawnHiddenService({
    targetPort,
    privKey,
    virtPort = 443,
  }: {
    targetPort: number
    privKey: string
    virtPort?: number
  }): Promise<string> {
    const status = await this.torControl.sendCommand(
      `ADD_ONION ${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )
    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    this.hiddenServices.set(onionAddress, onionAddress)
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
    virtPort = 443,
  }: {
    targetPort: number
    virtPort?: number
  }): Promise<{ onionAddress: string; privateKey: string }> {
    const status = await this.torControl.sendCommand(
      `ADD_ONION NEW:BEST Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )

    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    const privateKey = status.messages[1].replace('250-PrivateKey=', '')

    this.hiddenServices.set(onionAddress, onionAddress)
    return {
      onionAddress: `${onionAddress}.onion`,
      privateKey,
    }
  }

  public async switchToCleanCircuts() {
    try {
      this.logger('Sending newnym')
      const response = await this.torControl.sendCommand('SIGNAL NEWNYM')
      this.logger('Newnym response', response)
    } catch (e) {
      this.logger('Could not send newnym', e.message)
    }
  }

  public async getInfo(getInfoTarget: GetInfoTorSignal) {
    try {
      const response = await this.torControl.sendCommand(`GETINFO ${getInfoTarget}`)
      this.logger('GETINFO', getInfoTarget, response)
    } catch (e) {
      this.logger('Could not get info', getInfoTarget)
    }
  }

  public async kill(): Promise<void> {
    // for (const hs of this.hiddenServices.keys()) {
    //   await this.destroyHiddenService(hs)
    // }
    return await new Promise((resolve, reject) => {
      this.logger('Killing tor...')
      if (this.process === null) {
        this.logger('TOR: Process is not initalized.')
        resolve()
        return
      }
      this.process?.on('close', () => {
        this.process = null
        resolve()
        return
      })
      this.process?.on('error', () => {
        reject(new Error('TOR: Something went wrong with killing tor process'))
      })
      this.process?.kill()
    })
  }
}
