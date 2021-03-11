import * as child_process from 'child_process'
import { TorControl } from './torControl'

interface IService {
  virtPort: number
  address: string
}
interface IConstructor {
  torPath: string
  settingsPath: string
  options?: child_process.SpawnOptionsWithoutStdio
}
export class Tor {
  process: child_process.ChildProcessWithoutNullStreams | null = null
  torPath: string
  settingsPath: string
  options?: child_process.SpawnOptionsWithoutStdio
  services: Map<number, IService>
  torControl: TorControl
  constructor({ settingsPath, torPath, options }: IConstructor) {
    this.settingsPath = settingsPath
    this.torPath = torPath
    this.options = options
    this.services = new Map()
    this.torControl = new TorControl()
  }
  public init = (timeout = 20000): Promise<void> =>
    new Promise((resolve, reject) => {
      if (this.process) {
        throw new Error('Already initialized')
      }
      this.process = child_process.spawn(this.torPath, ['-f', this.settingsPath], this.options)
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

  public async addOnion({ virtPort, targetPort, privKey }: { virtPort: number, targetPort: number, privKey: string }): Promise<string> {
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

  public async addNewService(virtPort:number, targetPort: number): Promise<{onionAddress: string, privateKey: string}> {
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
