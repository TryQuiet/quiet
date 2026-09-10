import { Inject, Injectable } from '@nestjs/common'
import net from 'net'
import { Mutex } from 'async-mutex'
import { CONFIG_OPTIONS, TOR_CONTROL_PARAMS } from '../const'
import { ConfigOptions } from '../types'
import { TorControlAuthType, TorControlParams, type TorControlCredentialsWaiter } from './tor.types'
import { createLogger } from '../common/logger'

class TorControlAuthenticationError extends Error {}

@Injectable()
export class TorControl {
  connection: net.Socket | null
  isSending: boolean
  authString: string
  private readonly logger = createLogger(TorControl.name)
  private readonly commandMutex = new Mutex()
  private credentialsWaiter: TorControlCredentialsWaiter | undefined
  private closed = false

  constructor(
    @Inject(TOR_CONTROL_PARAMS) public torControlParams: TorControlParams,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions
  ) {
    this.isSending = false
  }

  public get hasCredentials(): boolean {
    return Boolean(this.torControlParams.auth.value)
  }

  public waitForCredentials(): Promise<void> {
    if (this.closed) return Promise.reject(new Error('Tor control is closed'))
    if (this.hasCredentials) return Promise.resolve()
    if (!this.credentialsWaiter) {
      let resolve!: () => void
      let reject!: (error: Error) => void
      const promise = new Promise<void>((onResolve, onReject) => {
        resolve = onResolve
        reject = onReject
      })
      this.credentialsWaiter = { promise, resolve, reject }
      this.logger.debug('Waiting for Tor control credentials')
    }
    return this.credentialsWaiter.promise
  }

  public updateConnectionParams(params: TorControlParams): void {
    this.torControlParams = { ...params, auth: { ...params.auth } }
    if (this.hasCredentials) {
      this.credentialsWaiter?.resolve()
      this.credentialsWaiter = undefined
    }
  }

  public onModuleDestroy(): void {
    this.closed = true
    this.commandMutex.cancel()
    this.credentialsWaiter?.reject(new Error('Tor control is closed'))
    this.credentialsWaiter = undefined
    this.disconnect()
  }

  private updateAuthString() {
    if (this.torControlParams.auth.type === TorControlAuthType.PASSWORD) {
      this.authString = 'AUTHENTICATE "' + this.torControlParams.auth.value + '"\r\n'
    }
    if (this.torControlParams.auth.type === TorControlAuthType.COOKIE) {
      // Cookie authentication must be invoked as a hexadecimal string passed without double quotes
      this.authString = 'AUTHENTICATE ' + this.torControlParams.auth.value + '\r\n'
    }
  }

  private async _connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.connection = net.connect({
        port: this.torControlParams.port,
        family: 4,
      })

      this.connection.once('error', err => {
        this.disconnect()
        reject(new Error(`Connection via Tor control failed: ${err}`))
      })

      this.connection.once('data', (data: any) => {
        if (/250 OK/.test(data.toString())) {
          resolve()
        } else {
          this.disconnect()
          const message = `Tor Control port error: ${data.toString() as string}`
          reject(/^515\b/.test(data.toString()) ? new TorControlAuthenticationError(message) : new Error(message))
        }
      })

      this.updateAuthString()
      this.connection.write(this.authString)
    })
  }

  private async connect(): Promise<void> {
    // TODO: We may want to limit the number of connection attempts.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.waitForCredentials()
      try {
        this.logger.debug(`Connecting to Tor, host: ${this.torControlParams.host} port: ${this.torControlParams.port}`)
        await this._connect()
        return
      } catch (e) {
        // Retrying the same rejected credentials cannot repair authentication.
        // Let the caller recover or a native rewire install fresh credentials.
        if (e instanceof TorControlAuthenticationError) throw e
        this.logger.error('Retrying due to error...', e)
        await new Promise(r => setTimeout(r, 500))
      }
    }
  }

  private disconnect() {
    try {
      this.connection?.end()
    } catch (e) {
      this.logger.error('Disconnect failed:', e)
    }
    this.connection = null
  }

  public _sendCommand(command: string): Promise<{ code: number; messages: string[] }> {
    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject('Timeout while sending command to Tor')
      }, 5000)

      this.connection?.on('data', data => {
        const dataArray = data.toString().split(/\r?\n/)

        if (dataArray[0].startsWith('250')) {
          resolve({ code: 250, messages: dataArray })
        } else {
          clearTimeout(connectionTimeout)
          this.logger.error('Tor control command failed', {
            responseCode: dataArray[0].slice(0, 3),
            messageCount: dataArray.length,
          })
          reject(`${dataArray[0]}`)
        }
        clearTimeout(connectionTimeout)
      })

      this.connection?.write(command + '\r\n')
    })
  }

  public async sendCommand(command: string): Promise<{ code: number; messages: string[] }> {
    return this.commandMutex.runExclusive(async () => {
      // Every command path shares this gate, including ADD_ONION during community creation.
      await this.waitForCredentials()
      const commandName = command.trim().split(/\s+/, 1)[0]?.toUpperCase() || 'UNKNOWN'
      this.logger.debug('Sending Tor command', { command: commandName })
      this.isSending = true
      try {
        await this.connect()
        const res = await this._sendCommand(command)
        this.logger.debug('Tor command response', {
          command: commandName,
          code: res.code,
          messageCount: res.messages.length,
        })
        return res
      } finally {
        this.disconnect()
        this.isSending = false
      }
    })
  }
}
