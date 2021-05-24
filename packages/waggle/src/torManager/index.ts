import * as child_process from 'child_process'
import * as fs from 'fs'
import path from 'path'
import { TorControl } from './torControl'
import { ZBAY_DIR_PATH } from '../constants'
import { sleep } from './../sleep'
import debug from 'debug'
const log = Object.assign(debug('waggle:tor'), {
  error: debug('waggle:tor:err')
})

interface IService {
  virtPort: number
  address: string
}
interface IConstructor {
  torPath: string
  options?: child_process.SpawnOptionsWithoutStdio
  appDataPath?: string
  controlPort?: number
}
export class Tor {
  process: child_process.ChildProcessWithoutNullStreams | any = null
  torPath: string
  options?: child_process.SpawnOptionsWithoutStdio
  services: Map<number, IService>
  torControl: TorControl
  appDataPath: string
  controlPort: number
  constructor({ torPath, options, appDataPath, controlPort }: IConstructor) {
    this.torPath = torPath
    this.options = options
    this.services = new Map()
    this.torControl = new TorControl({ port: controlPort })
    this.appDataPath = appDataPath
    this.controlPort = controlPort
  }

  public init = async (timeout = 80000): Promise<void> =>
    await new Promise(async (resolve, reject) => {
      if (this.process) {
        throw new Error('Already initialized')
      }

      if (process.platform !== 'win32') {
        await this.killHangingTorProcess()
      }

      const TorDataDirectory = path.join.apply(null, [this.appDataPath, 'TorDataDirectory'])
      const torrc = `ControlPort ${this.controlPort}\nDataDirectory ${TorDataDirectory}`
      fs.writeFileSync(`${this.appDataPath}/torrc`, torrc, 'utf8')
      const settingsPath = `${this.appDataPath}/torrc`

      const TorPidPath = path.join.apply(null, [this.appDataPath || ZBAY_DIR_PATH, 'torPid.json'])

      this.process = child_process.spawn(this.torPath, ['-f', settingsPath], this.options)

      const a = async (retries: number, currentRetry: number, sleepTime: number) => {
        if (currentRetry < retries) {
          try {
            console.log('INITIALIZING TOR')
            await this.torControl.signal('HEARTBEAT')
            resolve()
          } catch (err) {
            log.error('error connecting')
            await sleep(sleepTime)
            await a(retries, currentRetry + 1, sleepTime)
          }
        } else {
          console.log('TOO MANY ATTEMPTS, TOR INITIALIZATION FAILED, CHECK IF TOR PROCESS IS NOT RUNNING ALREADY')
          reject()
        }
      }

      await a(20, 0, 1000)

      const newProcessPid = {
        pid: this.process.pid
      }

      const pidJson = JSON.stringify(newProcessPid)
      fs.writeFileSync(TorPidPath, pidJson)
      this.process.stdout.on('data', (data: Buffer) => {
        if (
          !data
            .toString()
            .includes(
              'Closed 1 streams for service [scrubbed].onion for reason resolve failed. Fetch status: No more HSDir available to query.'
            )
        ) {
          console.log(data.toString())
        }
      })
    })

  public async setSocksPort(port: number): Promise<void> {
    await this.torControl.setConf(`SocksPort="${port}"`)
  }

  public async setHttpTunnelPort(port: number): Promise<void> {
    await this.torControl.setConf(`HTTPTunnelPort="${port}"`)
  }

  public async addOnion({
    virtPort,
    targetPort,
    privKey
  }: {
    virtPort: number
    targetPort: number
    privKey: string
  }): Promise<string> {
    const status = await this.torControl.addOnion(
      `${privKey} Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )
    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    this.services.set(virtPort, {
      virtPort,
      address: onionAddress
    })
    return onionAddress
  }

  public async deleteOnion(serviceId: string): Promise<void> {
    await this.torControl.delOnion(serviceId)
  }

  public async addNewService(
    virtPort: number,
    targetPort: number
  ): Promise<{ onionAddress: string, privateKey: string }> {
    const status = await this.torControl.addOnion(
      `NEW:BEST Flags=Detach Port=${virtPort},127.0.0.1:${targetPort}`
    )

    const onionAddress = status.messages[0].replace('250-ServiceID=', '')
    const privateKey = status.messages[1].replace('250-PrivateKey=', '')
    this.services.set(virtPort, {
      virtPort,
      address: onionAddress
    })
    return {
      onionAddress,
      privateKey
    }
  }

  public getServiceAddress = (port: number): string => {
    if (this.services.get(port).address) {
      return this.services.get(port).address
    }
    throw new Error('cannot get service addres')
  }

  private readonly killHangingTorProcess = async (): Promise<void> => {
    return await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('ERROR: Cannot kill hanging tor process, kill it manually and restart app')
      }, 30_000)
      const TorPidPath = path.join.apply(null, [this.appDataPath || ZBAY_DIR_PATH, 'torPid.json'])
      fs.access(TorPidPath, fs.constants.F_OK, async err => {
        if (err) {
          log('INFO: Cannot find old tor pid file, probably it is the first launch of Zbay')
          resolve()
        }
        const file: unknown = fs.readFileSync(TorPidPath)
        const oldProcessPid = JSON.parse(file as string).pid

        let isAlive = true

        while (isAlive) {
          await sleep()
          try {
            log(`INFO: trying to kill tor on port ${oldProcessPid}`)
            log(process.kill(oldProcessPid, 'SIGTERM'))
          } catch (e) {
            log(e)
            clearTimeout(timeout)
            log(`SUCCESS: Killed old tor process hanging on port ${oldProcessPid}`)
            isAlive = false
            resolve()
          }
        }
      })
    })
  }

  public kill = async (): Promise<void> =>
    await new Promise((resolve, reject) => {
      if (this.process === null) {
        reject('Process is not initalized.')
      }
      this.process?.on('close', () => {
        resolve()
      })
      this.process?.kill()
    })
}
