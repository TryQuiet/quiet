import * as child_process from 'child_process'
import crypto from 'crypto'
import * as fs from 'fs'
import path from 'path'
import { QUIET_DIR_PATH } from '../constants'
import logger from '../logger'
import { removeFilesFromDir } from '../common/utils'
import { TorControl } from './TorControl'
import getPort from 'get-port'
const log = logger('tor')

interface IConstructor {
  torPath?: string
  options: child_process.SpawnOptionsWithoutStdio
  appDataPath: string
  httpTunnelPort: number
  controlPort?: number
  authCookie?: string
}
export class Tor {
  httpTunnelPort: number
  socksPort: number
  controlPort: number

  process: child_process.ChildProcessWithoutNullStreams | any = null
  torPath: string
  options?: child_process.SpawnOptionsWithoutStdio
  torControl: TorControl
  appDataPath: string
  torDataDirectory: string
  torPidPath: string
  torPassword: string
  torHashedPassword: string
  torAuthCookie: string
  constructor({
    torPath,
    options,
    appDataPath,
    httpTunnelPort,
    controlPort,
    authCookie
  }: IConstructor) {
    this.torPath = torPath ? path.normalize(torPath) : null
    this.options = options
    this.appDataPath = appDataPath
    this.httpTunnelPort = httpTunnelPort
    this.controlPort = controlPort || null
    this.torAuthCookie = authCookie || null
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
      let oldTorPid = null

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
    this.torControl = new TorControl({
      port: this.controlPort,
      host: 'localhost',
      password: this.torPassword,
      cookie: this.torAuthCookie
    })
    console.log('IOS: Tor control initialized')
  }

  private readonly torProcessNameCommand = (oldTorPid: string): string => {
    const byPlatform = {
      android: `ps -p ${oldTorPid} -o comm=`,
      linux: `ps -p ${oldTorPid} -o comm=`,
      darwin: `ps -c -p ${oldTorPid} -o comm=`,
      win32: `TASKLIST /FI "PID eq ${oldTorPid}"`
    }
    return byPlatform[process.platform]
  }

  private readonly hangingTorProcessCommand = (): string => {
    /**
     *  Commands should output hanging tor pid
     */
    const byPlatform = {
      android: `pgrep -af ${this.torDataDirectory} | grep -v pgrep | awk '{print $1}'`,
      linux: `pgrep -af ${this.torDataDirectory} | grep -v pgrep | awk '{print $1}'`,
      darwin: `ps -A | grep ${this.torDataDirectory} | grep -v grep | awk '{print $1}'`,
      win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${this.torDataDirectory.replace(/\\/g, '\\\\')}%' and name = 'tor.exe'} | Format-Table ProcessId -HideTableHeaders"`
    }
    return byPlatform[process.platform]
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

  public clearOldTorProcess = (oldTorPid: number) => {
    if (!oldTorPid) return
    child_process.exec(
      this.torProcessNameCommand(oldTorPid.toString()),
      (err: child_process.ExecException, stdout: string, _stderr: string) => {
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
        oldTorPid = null
      }
    )
  }

  protected readonly spawnTor = async (timeoutMs: number): Promise<void> => {
    return await new Promise((resolve, reject) => {
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
          this.torHashedPassword
        ],
        this.options
      )

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout of ${timeoutMs / 1000} while waiting for tor to bootstrap`))
      }, timeoutMs)

      this.process.stdout.on('data', data => {
        log(data.toString())
        const regexp = /Bootstrapped 100%/
        if (regexp.test(data.toString())) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })
  }

  public async spawnHiddenService(targetPort: number, privKey: string, virtPort: number = 443): Promise<string> {
    console.log('IOS: spawning hidden service')
    const status = await this.torControl.sendCommand(
      `ADD_ONION ${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
      )
      const onionAddress = status.messages[0].replace('250-ServiceID=', '')
      console.log('IOS: new hidde service address is ', `${onionAddress}`)
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

    public async createNewHiddenService(
      targetPort: number,
      virtPort: number = 443
      ): Promise<{ onionAddress: string; privateKey: string }> {
        console.log('IOS: spawning hidden service')
        const status = await this.torControl.sendCommand(
          `ADD_ONION NEW:BEST Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
          )

          const onionAddress = status.messages[0].replace('250-ServiceID=', '')
          const privateKey = status.messages[1].replace('250-PrivateKey=', '')
          console.log('IOS: new hidde service address is ', `${onionAddress}`)

          return {
      onionAddress: `${onionAddress}.onion`,
      privateKey
    }
  }

  public generateHashedPassword = () => {
    const password = crypto.randomBytes(16).toString('hex')
    const hashedPassword = child_process.execSync(
      `${this.torPath} --quiet --hash-password ${password}`,
      { env: this.options.env }
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
