import net from 'net'
import logger from '../logger'
const log = logger('torControl')

export enum TorControlAuthType {
  COOKIE = 'cookie',
  PASSWORD = 'password',
}

interface IOpts {
  port: number
  host: string
  auth: {
    type: TorControlAuthType
    value: string
  }
}

interface IParams {
  port: number
  family: number
}

export class TorControl {
  connection: net.Socket | null
  authString: string
  params: IParams

  constructor(opts: IOpts) {
    this.params = {
      port: opts.port,
      family: 4,
    }
    if (opts.auth.type === TorControlAuthType.PASSWORD) {
      this.authString = 'AUTHENTICATE "' + opts.auth.value + '"\r\n'
    }
    if (opts.auth.type === TorControlAuthType.COOKIE) {
      // Cookie authentication must be invoked as a hexadecimal string passed without double quotes
      this.authString = 'AUTHENTICATE ' + opts.auth.value + '\r\n'
    }
  }

  private async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (this.connection) {
        reject(new Error('TOR: Connection already established'))
      }

      this.connection = net.connect(this.params)

      this.connection.once('error', err => {
        reject(new Error(`TOR: Connection via tor control failed: ${err.message}`))
      })
      this.connection.once('data', (data: any) => {
        if (/250 OK/.test(data.toString())) {
          resolve()
        } else {
          reject(new Error(`TOR: Control port error: ${data.toString() as string}`))
        }
      })
      this.connection.write(this.authString)
    })
  }

  private async disconnect() {
    try {
      this.connection?.end()
    } catch (e) {
      log.error('Cant disconnect', e.message)
    }
    this.connection = null
  }

  private async _sendCommand(
    command: string,
    resolve: (value: { code: number; messages: string[] }) => void,
    reject: (reason?: any) => void
  ) {
    await this.connect()
    const connectionTimeout = setTimeout(() => {
      reject('TOR: Send command timeout')
    }, 5000)
    this.connection?.on('data', async data => {
      await this.disconnect()
      const dataArray = data.toString().split(/\r?\n/)
      if (dataArray[0].startsWith('250')) {
        resolve({ code: 250, messages: dataArray })
      } else {
        clearTimeout(connectionTimeout)
        reject(`${dataArray[0]}`)
      }
      clearTimeout(connectionTimeout)
    })
    this.connection?.write(command + '\r\n')
  }

  public async sendCommand(command: string): Promise<{ code: number; messages: string[] }> {
    return await new Promise((resolve, reject) => {
      void this._sendCommand(command, resolve, reject)
    })
  }
}
