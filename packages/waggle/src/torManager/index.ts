import * as child_process from 'child_process'
import * as fs from 'fs'
import path from 'path'
import { TorControl } from './torControl'
import { ZBAY_DIR_PATH } from '../constants'
import { sleep } from './../sleep'
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
  public init = (timeout = 20000): Promise<void> =>
    new Promise(async (resolve, reject) => {
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

      const newProcessPid = {
        pid: this.process.pid
      }
      const pidJson = JSON.stringify(newProcessPid)
      fs.writeFileSync(TorPidPath, pidJson)

      const id = setTimeout(() => {
        this.process?.kill()
        reject('Process timeout')
      }, timeout)
      this.process.stdout.on('data', (data: Buffer) => {
        console.log(data.toString())
        if (data.toString().includes('100%')) {
          clearTimeout(id)
          resolve()
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
  ): Promise<{ onionAddress: string; privateKey: string }> {
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

  private killHangingTorProcess = async (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('ERROR: Cannot kill hanging tor process, kill it manually and restart app')
      }, 30_000)
      const TorPidPath = path.join.apply(null, [this.appDataPath || ZBAY_DIR_PATH, 'torPid.json'])
      fs.access(TorPidPath, fs.constants.F_OK, async err => {
        if (err) {
          console.log('INFO: Cannot find old tor pid file, probably it is the first launch of Zbay')
          resolve()
        }
        const file: unknown = fs.readFileSync(TorPidPath)
        const oldProcessPid = JSON.parse(file as string).pid

        let isAlive = true

        while (isAlive) {
          await sleep()
          try {
            console.log(`INFO: trying to kill tor on port ${oldProcessPid}`)
            console.log(process.kill(oldProcessPid, 'SIGTERM'))
          } catch (e) {
            console.log(e)
            clearTimeout(timeout)
            console.log(`SUCCESS: Killed old tor process hanging on port ${oldProcessPid}`)
            isAlive = false
            resolve()
          }
        }
      })
    })
  }

  public kill = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (this.process === null) {
        reject('Process is not initalized.')
      }
      this.process?.on('close', () => {
        resolve()
      })
      this.process?.kill()
    })
}
