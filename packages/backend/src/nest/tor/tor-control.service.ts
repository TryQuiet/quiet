import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import net from 'net'
import { CONFIG_OPTIONS, TOR_CONTROL_PARAMS } from '../const'
import { ConfigOptions } from '../types'
import { TorControlAuthType, TorControlParams } from './tor.types'
import Logger from '../common/logger'

@Injectable()
export class TorControl implements OnModuleInit {
  connection: net.Socket | null
  authString: string
  private readonly logger = Logger(TorControl.name)
  constructor(
    @Inject(TOR_CONTROL_PARAMS) public torControlParams: TorControlParams,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions
  ) {}

  onModuleInit() {
    if (this.torControlParams.auth.type === TorControlAuthType.PASSWORD) {
      this.authString = 'AUTHENTICATE "' + this.torControlParams.auth.value + '"\r\n'
    }
    if (this.torControlParams.auth.type === TorControlAuthType.COOKIE) {
      // Cookie authentication must be invoked as a hexadecimal string passed without double quotes
      this.authString = 'AUTHENTICATE ' + this.torControlParams.auth.value + '\r\n'
    }
  }

  private async connect(): Promise<void> {
    console.log('this.torControlParams', this.torControlParams)
    console.log('configOptions.torControl', this.configOptions.torControlPort)
    return await new Promise((resolve, reject) => {
      if (this.connection) {
        reject(new Error('TOR: Connection already established'))
      }

      this.connection = net.connect({
        port: this.torControlParams.port,
        family: 4,
      })

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
      this.logger.log.error('Cant disconnect', e.message)
    }
    this.connection = null
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private async _sendCommand(command: string, resolve: Function, reject: Function) {
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
