import net from 'net'
import logger from '../logger'
const log = logger('torControl')

interface IOpts {
  port: number
  host: string
  password: string
  cookie: string
}

interface IParams {
  port: number
  host: string
}

export class TorControl {
  connection: net.Socket
  password: string
  cookie: string
  params: IParams
  constructor(opts: IOpts) {
    this.params = {
      port: opts.port,
      host: opts.host
    }
    this.password = opts.password
    this.cookie = opts.cookie
  }

  private async connect(): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (this.connection) {
        reject(new Error('TOR: Connection already established'))
      }

      this.connection = net.connect(this.params)
      log('Connected')

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
      if (this.password) {
        this.connection.write('AUTHENTICATE "' + this.password + '"\r\n')
      } else if (this.cookie) {
        // Cookie authentication must be invoked as a hexadecimal string passed without double quotes
        this.connection.write('AUTHENTICATE ' + this.cookie + '\r\n')
      }
    })
  }

  private async disconnect() {
    log('Disconnecting')
    try {
      this.connection.end()
      this.connection = null
    } catch (e) {
      log.error('Cant disconnect, no connection', e.message)
    }
    
    
  }

  private async _sendCommand(command: string, resolve: Function, reject: Function) {
    try {
      await this.connect()
    } catch (e) {
      if (!e.message.includes('Connection already established')) {
        throw e
      }
    }
    
    const connectionTimeout = setTimeout(() => {
      reject('TOR: Send command timeout')
    }, 5000)
    // eslint-disable-next-line
    this.connection.on('data', async data => {
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
    this.connection.write(command + '\r\n')
  }

  public async sendCommand(command: string): Promise<{ code: number; messages: string[] }> {
    return await new Promise((resolve, reject) => {
      // eslint-disable-next-line
      this._sendCommand(command, resolve, reject)
    })
  }
}
