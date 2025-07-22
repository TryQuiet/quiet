/**
 * QSS websocket client wrapper
 */
import { Inject, Injectable } from '@nestjs/common'
import { connect, type Socket as ClientSocket } from 'socket.io-client'

import { createLogger } from '../common/logger'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../const'
import { QSSConnectionError, QSSNotInitializedError, WebsocketEvents } from './qss.types'
import { sleep } from '../common/sleep'
import { CLIENT_TRANSPORTS } from './qss.const'

@Injectable()
export class QSSClient {
  /**
   * Socket.io socket instance
   */
  public clientSocket: ClientSocket | undefined = undefined

  private readonly logger = createLogger(`qss:client`)

  constructor(
    // environment variable that determines if we are using QSS
    @Inject(QSS_ALLOWED) private qssAllowed: boolean,
    // environment variable that determines what endpoint we connect to QSS on
    @Inject(QSS_ENDPOINT) private qssEndpoint: string
  ) {}

  /**
   * Create and connect a socket.io socket to QSS
   *
   * @param qssEndpoint Determined by the QSS_ENDPOINT env variable and data stored in community metadata and V3 invites
   * @returns Connected socket.io socket instance
   */
  public async createSocket(qssEndpoint: string | undefined): Promise<ClientSocket> {
    this.qssEndpoint = qssEndpoint ?? this.qssEndpoint

    if (!this.qssAllowed || this.qssEndpoint == null) {
      throw new QSSNotInitializedError(`QSS is not enabled`)
    }

    // check for an existing socket instance and, if connected, return that socket and move on
    if (this.clientSocket != null && this.clientSocket.active) {
      this.logger.warn('createSocket was already called and the socket is active!')
      return this.clientSocket
    }

    // create a new websocket to QSS
    this.logger.info(`Creating and connecting client socket`)
    this.clientSocket = connect(this.qssEndpoint, {
      autoConnect: false,
      forceNew: true,
      transports: CLIENT_TRANSPORTS,
    })
    // wait for socket to connect with QSS instance
    await this._waitForConnect()

    return this.clientSocket
  }

  /**
   * Wait for QSS socket connection to finish connecting
   */
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

  /**
   * Send a websocket message over our socket to QSS and, optionally, handle a response
   *
   * @param event Name of event being sent to QSS
   * @param payload Message payload to be sent
   * @param withAck If true expect and return an ack response
   * @returns A response object if `withAck` is true, otherwise undefined
   */
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

  /**
   * Close our socket connection with QSS
   */
  public close(): void {
    if (this.clientSocket == null) {
      this.logger.trace(`Client socket wasn't open!`)
      return
    }

    this.logger.info(`Closing client socket`)
    this.clientSocket.close()
  }
}
