/**
 * QSS websocket client wrapper
 */
import { Inject, Injectable } from '@nestjs/common'
import { connect, type Socket as ClientSocket } from 'socket.io-client'

import { createLogger } from '../common/logger'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../const'
import { QSSConnectionError, QSSEvents, QSSNotInitializedError, WebsocketEvents } from './qss.types'
import { sleep } from '../common/sleep'
import { CLIENT_TRANSPORTS } from './qss.const'
import { CompoundError } from '@quiet/types'
import EventEmitter from 'node:events'

@Injectable()
export class QSSClient extends EventEmitter {
  /**
   * Socket.io socket instance
   */
  private _clientSocket: ClientSocket | undefined = undefined

  private readonly logger = createLogger(`qss:client`)

  constructor(
    // environment variable that determines if we are using QSS
    @Inject(QSS_ALLOWED) private qssAllowed: boolean,
    // environment variable that determines what endpoint we connect to QSS on
    @Inject(QSS_ENDPOINT) private qssEndpoint: string
  ) {
    super()
  }

  public get connected(): boolean {
    const socket = this.getClientSocket()
    this.logger.warn(socket, socket?.active, socket?.connected)
    return socket != null && socket.active && socket.connected
  }

  public getClientSocket(): ClientSocket | undefined {
    return this._clientSocket
  }

  /**
   * Create and connect a socket.io socket to QSS
   *
   * @param qssEndpoint Determined by the QSS_ENDPOINT env variable and data stored in community metadata and V3 invites
   * @returns Connected socket.io socket instance
   */
  public async createSocketAndConnect(qssEndpoint: string | undefined): Promise<ClientSocket> {
    try {
      this.qssEndpoint = qssEndpoint ?? this.qssEndpoint

      if (!this.qssAllowed || this.qssEndpoint == null) {
        throw new QSSNotInitializedError(`QSS is not enabled`)
      }

      // check for an existing socket instance and, if connected, return that socket and move on
      if (this.connected) {
        this.logger.warn('createSocket was already called and the socket is active!')
        return this._clientSocket!
      }

      // create a new websocket to QSS
      this.logger.info(`Creating and connecting client socket`)
      this._clientSocket = connect(this.qssEndpoint, {
        autoConnect: false,
        forceNew: false,
        transports: CLIENT_TRANSPORTS,
      })
      // wait for socket to connect with QSS instance
      await this._waitForConnect()

      return this._clientSocket
    } catch (e) {
      const message = `Failed to connect to QSS, will retry later!`
      this.logger.error(message, e)
      throw new CompoundError(message, e)
    }
  }

  /**
   * Wait for QSS socket connection to finish connecting
   */
  private async _waitForConnect(): Promise<void> {
    if (this._clientSocket == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    if (this.connected) {
      this.logger.debug('QSS already connected')
      return
    }

    this._clientSocket.on('connect', (): void => {
      this.logger.debug('QSS connected!', this._clientSocket?.id)
      this.emit(QSSEvents.QSS_CONNECTED)
    })

    this._clientSocket.on('disconnect', (): void => {
      this.logger.debug('QSS disconnected!')
      this.emit(QSSEvents.QSS_DISCONNECTED)
      this._clientSocket?.close()
    })

    // forward Quiet websocket events from the socket connection to the client's own emitter
    this._clientSocket.onAny((eventName: string, ...args: any[]): void => {
      if (Object.values(WebsocketEvents).includes(eventName as any)) {
        this.emit(eventName, ...args)
      }
    })

    this._clientSocket.connect()
    let count = 20
    while (!this.connected) {
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
    const socket = this.getClientSocket()
    try {
      if (!this.connected) {
        throw new QSSNotInitializedError(`Must run createSocket first!`)
      }
      if (withAck) {
        return (await socket!.emitWithAck(event, payload)) as T
      }

      socket!.emit(event, payload)
    } catch (e) {
      this.logger.error('Error while sending message to QSS', e)
    }
    return undefined
  }

  /**
   * Close our socket connection with QSS
   */
  public close(): void {
    const socket = this.getClientSocket()
    if (socket == null) {
      this.logger.trace(`Client socket wasn't open!`)
      return
    }

    this.logger.info(`Closing client socket`)
    socket.close()
  }
}
