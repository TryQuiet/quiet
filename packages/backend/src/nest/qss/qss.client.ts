import { Inject, Injectable } from '@nestjs/common'
import { connect, type Socket as ClientSocket } from 'socket.io-client'

import { createLogger } from '../common/logger'
import { QSS_ENABLED, QSS_ENDPOINT } from '../const'
import { QSSConnectionError, QSSNotInitializedError, WebsocketEvents } from './qss.types'
import { sleep } from '../common/sleep'
import { CLIENT_TRANSPORTS } from './qss.const'

@Injectable()
export class QSSClient {
  public clientSocket: ClientSocket | undefined = undefined

  private readonly logger = createLogger(`qss:client`)

  constructor(
    @Inject(QSS_ENABLED) private qssEnabled: boolean,
    @Inject(QSS_ENDPOINT) private qssEndpoint: string
  ) {}

  public async createSocket(qssEnabled: boolean, qssEndpoint: string | undefined): Promise<ClientSocket> {
    this.qssEnabled = qssEnabled || this.qssEnabled
    this.qssEndpoint = qssEndpoint ?? this.qssEndpoint

    if (!this.qssEnabled || this.qssEndpoint == null) {
      throw new QSSNotInitializedError(`QSS is not enabled`)
    }

    this.logger.info(`Creating client socket`)

    this.clientSocket = connect(this.qssEndpoint, {
      autoConnect: false,
      forceNew: true,
      transports: CLIENT_TRANSPORTS,
    })
    await this._waitForConnect()

    return this.clientSocket
  }

  private async _waitForConnect(): Promise<void> {
    if (this.clientSocket == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    this.clientSocket.connect()
    let count = 20
    while (!this.clientSocket.connected) {
      if (count < 0) {
        this.logger.error('QSS client failed to connect within timeout, closing socket')
        this.close()
        throw new QSSConnectionError(`Client didn't connect in time!`)
      }

      this.logger.debug(`Waiting for client to finish connecting...`)
      await sleep(500)
      count--
    }
  }

  public async sendMessage<T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> {
    this.logger.debug(`Sending message`, event)
    if (this.clientSocket == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    if (withAck) {
      return (await this.clientSocket.emitWithAck(event, payload)) as T
    }

    this.clientSocket.emit(event, payload)
    return undefined
  }

  public close(): void {
    if (this.clientSocket == null) {
      this.logger.trace(`Client socket wasn't open!`)
      return
    }

    this.logger.info(`Closing client socket`)
    this.clientSocket.close()
  }
}
