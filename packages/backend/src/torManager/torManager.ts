import * as child_process from 'child_process'
import crypto from 'crypto'
import * as fs from 'fs'
import path from 'path'
import { QUIET_DIR_PATH } from '../constants'
import logger from '../logger'

import { TorControl, TorControlAuthType } from './TorControl'
import getPort from 'get-port'
import { removeFilesFromDir } from '../common/utils'
import { EventEmitter } from 'events'
import { SocketActionTypes, SupportedPlatform } from '@quiet/types'

const log = logger('tor')

export enum GetInfoTorSignal {
  CONFIG_TEXT = 'config-text',
  CIRCUT_STATUS = 'circuit-status',
  ENTRY_GUARDS = 'entry-guards'
}

export interface TorParams {[arg: string]: string}

interface IConstructor {
  torPath?: string
  options: child_process.SpawnOptionsWithoutStdio
  appDataPath: string
  httpTunnelPort: number
  controlPort?: number
  authCookie?: string
  extraTorProcessParams?: TorParams
}
export class Tor extends EventEmitter {
  httpTunnelPort: number
  socksPort: number
  controlPort?: number
  process: child_process.ChildProcessWithoutNullStreams | any = null
  torPath: string
  options?: child_process.SpawnOptionsWithoutStdio
  torControl: TorControl
  appDataPath: string
  torDataDirectory: string
  torPidPath: string
  torPassword: string
  torHashedPassword: string
  torAuthCookie?: string
  extraTorProcessParams: TorParams
  constructor({
    torPath,
    options,
    appDataPath,
    httpTunnelPort,
    extraTorProcessParams,
    controlPort,
    authCookie
  }: IConstructor) {
    super()
    this.torPath = torPath ? path.normalize(torPath) : ''
    this.options = options
    this.appDataPath = appDataPath
    this.httpTunnelPort = httpTunnelPort
    this.extraTorProcessParams = this.mergeDefaultTorParams(extraTorProcessParams)
    this.controlPort = controlPort
    this.torAuthCookie = authCookie
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
    log('Initializing tor...')
    this.controlPort = await getPort()
    this.socksPort = await getPort()
    return await new Promise((resolve, reject) => {
      if (this.process) {
        throw new Error('Tor already initialized')
      }
      this.generateHashedPassword()
      this.initTorControl()
      const dirPath = this.appDataPath || QUIET_DIR_PATH

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath)
      }

      this.torDataDirectory = path.join.apply(null, [dirPath, 'TorDataDirectory'])
      this.torPidPath = path.join.apply(null, [dirPath, 'torPid.json'])
      let oldTorPid: number | null = null

      if (fs.existsSync(this.torPidPath)) {
        const file = fs.readFileSync(this.torPidPath)
        oldTorPid = Number(file.toString())
        log(`${this.torPidPath} exists. Old tor pid: ${oldTorPid}`)
      }
      let counter = 0

      const tryToSpawnTor = async () => {
        log(`Trying to spawn tor for the ${counter} time...`)
        if (counter > repeat) {
          reject(new Error(`Failed to spawn tor ${counter} times`))
          return
        }

        this.clearOldTorProcess(oldTorPid)

        try {
          this.clearHangingTorProcess()
        } catch (e) {
          log('Error occured while trying to clear hanging tor processes')
        }

        try {
          await this.spawnTor(timeout)
          resolve()
        } catch {
          log('Killing tor')
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

  public initTorControl = () => {
    if (!this.controlPort) {
      throw new Error(`Can't initialize TorControl - no control port`)
    }
    this.torControl = new TorControl({
      port: this.controlPort,
      host: 'localhost',
      auth: {
        value: this.torAuthCookie || this.torPassword,
        type: this.torAuthCookie ? TorControlAuthType.COOKIE : TorControlAuthType.PASSWORD
      }
    })

  }

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
    log(`Found tor process with pid ${torProcessId}. Killing...`)
    try {
      process.kill(Number(torProcessId), 'SIGTERM')
    } catch (e) {
      log.error(`Tried killing hanging tor process. Failed. Reason: ${e.message}`)
    }
  }

  public clearOldTorProcess = (oldTorPid: number | null) => {
    if (!oldTorPid) return
    child_process.exec(
      this.torProcessNameCommand(oldTorPid.toString()),
      (err: child_process.ExecException | null, stdout: string, _stderr: string) => {
        if (err) {
          log.error(err)
        }
        if (stdout.trim() === 'tor' || stdout.search('tor.exe') !== -1) {
          log(`Killing old tor, pid: ${oldTorPid}`)
          try {
            process.kill(oldTorPid, 'SIGTERM')
          } catch (e) {
            log.error(`Tried killing old tor process. Failed. Reason: ${e.message}`)
          }
        } else {
          log(`Deleting ${this.torPidPath}`)
          fs.unlinkSync(this.torPidPath)
        }
      }
    )
  }

  protected readonly spawnTor = async (timeoutMs: number): Promise<void> => {
    return await new Promise((resolve, reject) => {
      if (!this.controlPort) {
        reject(new Error(`Can't spawn tor - no control port`))
        return
      }
      this.process = child_process.spawn(
        this.torPath,
        [
          '--SocksPort',
          this.socksPort.toString(),
          '--HTTPTunnelPort',
          this.httpTunnelPort.toString(),
          '--ControlPort',
          this.controlPort.toString(),
          '--PidFile',
          this.torPidPath,
          '--DataDirectory',
          this.torDataDirectory,
          '--HashedControlPassword',
          this.torHashedPassword,
          ...this.torProcessParams
        ],
        this.options
      )

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout of ${timeoutMs / 1000} while waiting for tor to bootstrap`))
      }, timeoutMs)

      this.process.stdout.on('data', (data: any) => {
        log(data.toString())
        this.emit(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, data.toString())
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
        log.error(`Couldn't destroy hidden service ${serviceId}`, err)
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
      log('Sending newnym')
      const response = await this.torControl.sendCommand('SIGNAL NEWNYM')
      log('Newnym response', response)
    } catch (e) {
      log('Could not send newnym', e.message)
    }
  }

  public async getInfo(getInfoTarget: GetInfoTorSignal) {
    try {
      const response = await this.torControl.sendCommand(`GETINFO ${getInfoTarget}`)
      log('GETINFO', getInfoTarget, response)
    } catch (e) {
      log('Could not get info', getInfoTarget)
    }
  }

  public generateHashedPassword = () => {
    const password = crypto.randomBytes(16).toString('hex')
    const hashedPassword = child_process.execSync(
      `${this.torPath} --quiet --hash-password ${password}`,
      { env: this.options?.env }
    )
    this.torPassword = password
    this.torHashedPassword = hashedPassword.toString().trim()
  }

  public kill = async (): Promise<void> =>
    await new Promise((resolve, reject) => {
      log('Killing tor...')
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
