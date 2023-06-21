import * as child_process from 'child_process'
import crypto from 'crypto'
import * as fs from 'fs'
import path from 'path'

import getPort from 'get-port'
import { removeFilesFromDir } from '../common/utils'
import { EventEmitter } from 'events'
import { SocketActionTypes, SupportedPlatform } from '@quiet/types'
import { Inject, Logger, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { TorControl } from './tor-control.service'
import { GetInfoTorSignal, TorParams, TorParamsProvider, TorPasswordProvider } from './tor.types'
import * as os from 'os'
import { sleep } from '../../sleep'
import { SocketService } from '../socket/socket.service'

export class Tor extends EventEmitter implements OnModuleInit {
  //   httpTunnelPort: number
  socksPort: number
  process: child_process.ChildProcessWithoutNullStreams | any = null
  // torPath: string
  // options?: child_process.SpawnOptionsWithoutStdio
  //   torControl: TorControl
  //   appDataPath: string
  torDataDirectory: string
  torPidPath: string
  // torPassword: string
  // torHashedPassword: string
  //   torAuthCookie?: string
  extraTorProcessParams: TorParams
  private readonly logger = new Logger(Tor.name)
  constructor(
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(TOR_PARAMS_PROVIDER) public readonly torParamsProvider: TorParamsProvider,
    @Inject(TOR_PASSWORD_PROVIDER) public readonly torPasswordProvider: TorPasswordProvider,
    // private readonly socketService: SocketService,
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    private readonly torControl: TorControl
  ) {
    super()
  }

  async onModuleInit() {
    
    // this.torPath = this.configOptions.torBinaryPath ? path.normalize(this.configOptions.torBinaryPath) : ''
    // this.options = {
    //   env: {
    //     LD_LIBRARY_PATH: this.configOptions.torResourcesPath,
    //     HOME: os.homedir()
    //   },
    //   detached: true
    // }
    // console.log('this.torControl', this.controlPort)
    await this.init()
    // this.extraTorProcessParams = this.mergeDefaultTorParams(extraTorProcessParams)
  }

  mergeDefaultTorParams = (params: TorParams = {}): TorParams => {
    const defaultParams = {
      '--NumEntryGuards': '3' // See task #1295
    }
    return { ...defaultParams, ...params }
  }

  get torProcessParams(): string[] {
    return Array.from(Object.entries(this.extraTorProcessParams)).flat()
  }

  public init = async ({ repeat = 6, timeout = 3600_000 } = {}): Promise<void> => {
    this.logger.log('Initializing tor...')
    this.socksPort = await getPort()
    return await new Promise((resolve, reject) => {
      if (this.process) {
        throw new Error('Tor already initialized')
      }
      // this.generateHashedPassword()
      // this.initTorControl()

      if (!fs.existsSync(this.quietDir)) {
        fs.mkdirSync(this.quietDir)
      }

      this.torDataDirectory = path.join.apply(null, [this.quietDir, 'TorDataDirectory'])
      this.torPidPath = path.join.apply(null, [this.quietDir, 'torPid.json'])
      let oldTorPid: number | null = null
      if (fs.existsSync(this.torPidPath)) {
        const file = fs.readFileSync(this.torPidPath)
        oldTorPid = Number(file.toString())
        this.logger.log(`${this.torPidPath} exists. Old tor pid: ${oldTorPid}`)
      }
      let counter = 0
      console.log(2)
      const tryToSpawnTor = async () => {
        this.logger.log(`Trying to spawn tor for the ${counter} time...`)
        if (counter > repeat) {
          reject(new Error(`Failed to spawn tor ${counter} times`))
          return
        }

        this.clearOldTorProcess(oldTorPid)

        try {
          this.clearHangingTorProcess()
        } catch (e) {
          this.logger.log('Error occured while trying to clear hanging tor processes')
        }

        try {
          await this.spawnTor(timeout)
          resolve()
        } catch {
          this.logger.log('Killing tor')
          await this.process.kill()
          removeFilesFromDir(this.torDataDirectory)
          counter++

          // eslint-disable-next-line
          process.nextTick(tryToSpawnTor)
        }
      }
      // eslint-disable-next-line
      tryToSpawnTor()

    })
  }

  // public initTorControl = () => {
  //   if (!this.controlPort) {
  //     throw new Error('Can\'t initialize TorControl - no control port')
  //   }
  //   this.torControl = new TorControl({
  //     port: this.controlPort,
  //     host: 'localhost',
  //     auth: {
  //       value: this.torAuthCookie || this.torPassword,
  //       type: this.torAuthCookie ? TorControlAuthType.COOKIE : TorControlAuthType.PASSWORD
  //     }
  //   })
  // }

  private readonly torProcessNameCommand = (oldTorPid: string): string => {
    const byPlatform = {
      android: `ps -p ${oldTorPid} -o comm=`,
      linux: `ps -p ${oldTorPid} -o comm=`,
      darwin: `ps -c -p ${oldTorPid} -o comm=`,
      win32: `TASKLIST /FI "PID eq ${oldTorPid}"`
    }
    return byPlatform[process.platform as SupportedPlatform]
  }

  private readonly hangingTorProcessCommand = (): string => {
    /**
     *  Commands should output hanging tor pid
     */
    const byPlatform = {
      android: `pgrep -af "${this.torDataDirectory}" | grep -v pgrep | awk '{print $1}'`,
      linux: `pgrep -af "${this.torDataDirectory}" | grep -v pgrep | awk '{print $1}'`,
      darwin: `ps -A | grep "${this.torDataDirectory}" | grep -v grep | awk '{print $1}'`,
      win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${this.torDataDirectory.replace(/\\/g, '\\\\')}%' and name = 'tor.exe'} | Format-Table ProcessId -HideTableHeaders"`
    }
    return byPlatform[process.platform as SupportedPlatform]
  }

  public clearHangingTorProcess = () => {
    const torProcessId = child_process.execSync(this.hangingTorProcessCommand()).toString('utf8').trim()
    if (!torProcessId) return
    this.logger.log(`Found tor process with pid ${torProcessId}. Killing...`)
    try {
      process.kill(Number(torProcessId), 'SIGTERM')
    } catch (e) {
      this.logger.error(`Tried killing hanging tor process. Failed. Reason: ${e.message}`)
    }
  }

  public clearOldTorProcess = (oldTorPid: number | null) => {
    if (!oldTorPid) return
    child_process.exec(
      this.torProcessNameCommand(oldTorPid.toString()),
      (err: child_process.ExecException | null, stdout: string, _stderr: string) => {
        if (err) {
          this.logger.error(err)
        }
        if (stdout.trim() === 'tor' || stdout.search('tor.exe') !== -1) {
          this.logger.log(`Killing old tor, pid: ${oldTorPid}`)
          try {
            process.kill(oldTorPid, 'SIGTERM')
          } catch (e) {
            this.logger.error(`Tried killing old tor process. Failed. Reason: ${e.message}`)
          }
        } else {
          this.logger.log(`Deleting ${this.torPidPath}`)
          fs.unlinkSync(this.torPidPath)
        }
      }
    )
  }

  protected readonly spawnTor = async (timeoutMs: number): Promise<void> => {
    return await new Promise((resolve, reject) => {
      if (!this.configOptions.torControlPort) {
        this.logger.error('Can\'t spawn tor - no control port')
        reject(new Error('Can\'t spawn tor - no control port'))
        return
      }
      if (!this.configOptions.httpTunnelPort) {
        this.logger.error('Can\'t spawn tor - no httpTunnelPort')

        reject(new Error('Can\'t spawn tor - no httpTunnelPort'))
        return
      }

      console.log([
        '--SocksPort',
        this.socksPort.toString(),
        '--HTTPTunnelPort',
        this.configOptions.httpTunnelPort.toString(),
        '--ControlPort',
        this.configOptions.torControlPort.toString(),
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
          this.configOptions.httpTunnelPort.toString(),
          '--ControlPort',
          this.configOptions.torControlPort.toString(),
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
        this.logger.log(data.toString())
         this.serverIoProvider.io.emit(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, data.toString())
        const regexp = /Bootstrapped 100%/
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
    virtPort = 443
  }: {
    targetPort: number
    privKey: string
    virtPort?: number
  }): Promise<string> {
    const status = await this.torControl.sendCommand(
      `ADD_ONION ${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )
    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    return `${onionAddress}.onion`
  }

  public async destroyHiddenService(serviceId: string): Promise<boolean> {
    try {
      await this.torControl.sendCommand(`DEL_ONION ${serviceId}`)
      return true
    } catch (err) {
      this.logger.error(`Couldn't destroy hidden service ${serviceId}`, err)
      return false
    }
  }

  public async createNewHiddenService({
    targetPort,
    virtPort = 443
  }: {
    targetPort: number
    virtPort?: number
  }): Promise<{ onionAddress: string; privateKey: string }> {
    const status = await this.torControl.sendCommand(
      `ADD_ONION NEW:BEST Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )

    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    const privateKey = status.messages[1].replace('250-PrivateKey=', '')

    return {
      onionAddress: `${onionAddress}.onion`,
      privateKey
    }
  }

  public async switchToCleanCircuts() {
    try {
      this.logger.log('Sending newnym')
      const response = await this.torControl.sendCommand('SIGNAL NEWNYM')
      this.logger.log('Newnym response', response)
    } catch (e) {
      this.logger.log('Could not send newnym', e.message)
    }
  }

  public async getInfo(getInfoTarget: GetInfoTorSignal) {
    try {
      const response = await this.torControl.sendCommand(`GETINFO ${getInfoTarget}`)
      this.logger.log('GETINFO', getInfoTarget, response)
    } catch (e) {
      this.logger.log('Could not get info', getInfoTarget)
    }
  }

  // public generateHashedPassword = () => {
  //   const password = crypto.randomBytes(16).toString('hex')
  //   const hashedPassword = child_process.execSync(
  //     `${this.torParamsProvider.torPath} --quiet --hash-password ${password}`,
  //     { env: this.options?.env }
  //   )
  //   this.torPassword = password
  //   this.torHashedPassword = hashedPassword.toString().trim()
  // }

  public kill = async (): Promise<void> =>
    await new Promise((resolve, reject) => {
      this.logger.log('Killing tor...')
      if (this.process === null) {
        reject(new Error('TOR: Process is not initalized.'))
      }
      this.process?.on('close', () => {
        resolve()
      })
      this.process?.on('error', () => {
        reject(new Error('TOR: Something went wrong with killing tor process'))
      })
      this.process?.kill()
    })
}
