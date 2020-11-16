import * as fs from 'fs'
import * as os from 'os'
import * as child_process from 'child_process'
import { sleep } from './sleep'
interface IService {
  port: number
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
  constructor({ settingsPath, torPath, options }: IConstructor) {
    this.settingsPath = settingsPath
    this.torPath = torPath
    this.options = options
    this.services = new Map()
    const data = fs.readFileSync(this.settingsPath, 'utf8').split('\n')
    const services = data.filter(text => text.startsWith('#SERVICE_'))
    for (const service of services) {
      const port = parseInt(service.substring(9))
      this.services.set(port, {
        port,
        address: this.getServiceAddress(port)
      })
    }
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
        if (data.includes('100%')) {
          clearTimeout(id)
          resolve()
        }
      })
    })
  public addService = async ({
    port = 3333,
    timeout = 8000,
    overwrite = true
  }): Promise<IService> => {
    if (this.process === null) {
      throw new Error('Process is not initalized.')
    }
    if (this.services.get(port)) {
      throw new Error('Service already exist')
    }

    if (fs.existsSync(`${os.homedir()}/tor_service_${port}`) && overwrite) {
      fs.rmdirSync(`${os.homedir()}/tor_service_${port}`, { recursive: true })
    }
    const data = fs.readFileSync(this.settingsPath, 'utf8').split('\n')
    const index = data.findIndex(text => text === '#Placeholder')
    data[index] = `#SERVICE_${port}
HiddenServiceDir ${os.homedir()}/tor_service_${port}
HiddenServicePort ${port} 127.0.0.1:${port}
#Placeholder`
    fs.writeFileSync(this.settingsPath, data.join('\n'), 'utf8')
    this.process?.kill('SIGHUP')
    await sleep()
    const id = setTimeout(() => {
      throw new Error('Timeout')
    }, timeout)
    while (true) {
      const address = this.getServiceAddress(port)
      if (address === null) {
        await sleep()
        continue
      }
      clearTimeout(id)
      this.services.set(port, { port, address })
      return { port, address }
    }
  }
  public killService = async ({ port = 3333, deleteKeys = true }): Promise<void> =>
    new Promise((resolve, reject) => {
      if (this.process === null) {
        reject('Process is not initalized.')
      }
      if (!this.services.get(port)) {
        reject('Service does not exist.')
      }
      const data = fs.readFileSync(this.settingsPath, 'utf8').split('\n')
      const index = data.findIndex(text => text === `#SERVICE_${port}`)
      data.splice(index, 3)
      fs.writeFileSync(this.settingsPath, data.join('\n'), 'utf8')
      this.process?.kill('SIGHUP')
      this.services.delete(port)
      if (fs.existsSync(`${os.homedir()}/tor_service_${port}`) && deleteKeys) {
        fs.rmdirSync(`${os.homedir()}/tor_service_${port}`, { recursive: true })
        resolve()
      }
    })
  private getServiceAddress = (port: number): string => {
    try {
      const address = fs.readFileSync(`${os.homedir()}/tor_service_${port}/hostname`, 'utf8').replace( /[\r\n]+/gm, "" )
      return address
    } catch (error) {
      console.log('error', error)
      throw new Error('Service does not exist')
    }
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
