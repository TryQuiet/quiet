import net from 'net'

interface IOpts {
  port: number
  host: string
  password: string
  cookie: string
}

interface IParams {
  port: number
}

export class TorControl {
  connection: net.Socket
  password: string
  cookie: string
  params: IParams
  constructor(opts: IOpts) {
    this.params = {
      port: opts.port,
    }
    this.password = opts.password
    this.cookie = opts.cookie
  }

  private async readonly connect(): Promise<void> {
    return await new Promise((resolve, reject) => {
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
      if (this.password) {
        this.connection.write('AUTHENTICATE "' + this.password + '"\r\n')
      } else if (this.cookie) {
        // Cookie authentication must be invoked as a hexadecimal string passed without double quotes
        this.connection.write('AUTHENTICATE ' + this.cookie + '\r\n')
      } else {
        throw new Error('you must provide either tor password or tor cookie')
      }
    })
  }

  private async readonly disconnect() {
    this.connection.end()
    this.connection = null
  }

  private async readonly _sendCommand(command: string, resolve: Function, reject: Function) {
    await this.connect()
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
