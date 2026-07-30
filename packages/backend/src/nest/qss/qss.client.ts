/**
 * QSS websocket client wrapper
 */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { connect, type Socket as ClientSocket } from 'socket.io-client'
import { DateTime } from 'luxon'

import { createLogger } from '../common/logger'
import { QSS_ALLOWED, QSS_ENDPOINT, SERVER_IO_PROVIDER } from '../const'
import {
  BaseWebsocketMessage,
  CaptchaVerifyMessage,
  CaptchaVerifyResponse,
  CommunityOperationStatus,
  GetCaptchaSiteKeyResponse,
  QSSConnectionError,
  QSSEvents,
  QSSNotInitializedError,
  WebsocketEvents,
} from './qss.types'
import {
  CLIENT_TRANSPORTS,
  QSS_CONNECT_TIMEOUT_BACKOFF_FACTOR,
  QSS_CONNECT_TIMEOUT_INITIAL_MS,
  QSS_CONNECT_TIMEOUT_MAX_MS,
} from './qss.const'
import { CaptchaErrorMessages, CompoundError, SocketEvents } from '@quiet/types'
import EventEmitter from 'node:events'
import { CaptchaService } from '../captcha/captcha.service'
import { ServerIoProviderTypes } from '../types'

@Injectable()
export class QSSClient extends EventEmitter {
  /**
   * Socket.io socket instance
   */
  private _clientSocket: ClientSocket | undefined = undefined
  private _clientSocketEndpoint: string | undefined = undefined
  private _connectPromise: Promise<ClientSocket> | undefined = undefined
  private _captchaVerified = false
  private _captchaVerificationPromise: Promise<boolean> | null = null
  private _connectTimeout: number = QSS_CONNECT_TIMEOUT_INITIAL_MS
  private _socketEventHandlers:
    | {
        socket: ClientSocket
        onConnect: () => void
        onDisconnect: () => void
        onAny: (eventName: string, ...args: any[]) => void
      }
    | undefined = undefined

  private readonly logger = createLogger(`qss:client`)

  constructor(
    // environment variable that determines if we are using QSS
    @Inject(QSS_ALLOWED) private qssAllowed: boolean,
    // environment variable that determines what endpoint we connect to QSS on
    @Inject(QSS_ENDPOINT) private qssEndpoint: string,
    @Inject(SERVER_IO_PROVIDER) private readonly serverIoProvider: ServerIoProviderTypes,
    private readonly captchaService: CaptchaService
  ) {
    super()
  }

  public get captchaVerified(): boolean {
    return this._captchaVerified
  }

  private set captchaVerified(value: boolean) {
    this._captchaVerified = value
  }

  public get connected(): boolean {
    const socket = this.getClientSocket()
    return socket != null && socket.active && socket.connected
  }

  public getClientSocket(): ClientSocket | undefined {
    return this._clientSocket
  }

  /**
   * Create and connect a socket.io socket to QSS
   *
   * @param qssEndpoint Determined by the QSS_ENDPOINT env variable and data stored in community metadata and V5 invites
   * @returns Connected socket.io socket instance
   */
  public async createSocketAndConnect(qssEndpoint: string | undefined): Promise<ClientSocket> {
    if (this._connectPromise != null) {
      this.logger.debug('QSS connection already in flight, returning existing connection promise')
      return this._connectPromise
    }

    const connectPromise = this._createSocketAndConnect(qssEndpoint)
    this._connectPromise = connectPromise

    try {
      return await connectPromise
    } finally {
      if (this._connectPromise === connectPromise) {
        this._connectPromise = undefined
      }
    }
  }

  private async _createSocketAndConnect(qssEndpoint: string | undefined): Promise<ClientSocket> {
    try {
      const requestedEndpoint = qssEndpoint ?? this.qssEndpoint
      this.qssEndpoint = requestedEndpoint

      if (!this.qssAllowed || this.qssEndpoint == null) {
        throw new QSSNotInitializedError(`QSS is not enabled`)
      }

      // check for an existing socket instance on the requested endpoint and, if connected, return that socket
      if (this.connected && this._clientSocketEndpoint === requestedEndpoint) {
        this.logger.warn('createSocket was already called and the socket is active!')
        return this._clientSocket!
      }

      if (this._clientSocket != null) {
        this._closeSocket(this._clientSocket)
      }

      // create a new websocket to QSS
      this.logger.info(`Creating and connecting client socket on ${this.qssEndpoint}`)
      const socket = connect(this.qssEndpoint, {
        autoConnect: false,
        forceNew: false,
        transports: CLIENT_TRANSPORTS,
      })
      this._clientSocket = socket
      this._clientSocketEndpoint = this.qssEndpoint
      // wait for socket to connect with QSS instance
      await this._waitForConnect()

      return socket
    } catch (e) {
      const message = `Failed to connect to QSS, will retry later!`
      this.logger.debug(message, e)
      throw new CompoundError(message, e)
    }
  }

  /**
   * Wait for QSS socket connection to finish connecting
   */
  private async _waitForConnect(): Promise<void> {
    const socket = this._clientSocket
    if (socket == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    if (this.connected) {
      this.logger.debug('QSS already connected')
      return
    }

    this._attachSocketEventHandlers(socket)

    this.logger.debug('Waiting for QSS socket to connect...')
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
        this.logger.error('QSS client failed to connect within timeout, closing socket')
        this._closeSocket(socket)
        this._connectTimeout = Math.min(
          this._connectTimeout * QSS_CONNECT_TIMEOUT_BACKOFF_FACTOR,
          QSS_CONNECT_TIMEOUT_MAX_MS
        )
        reject(new QSSConnectionError(`Client didn't connect in time!`))
      }, this._connectTimeout)

      const onConnect = (): void => {
        clearTimeout(timer)
        this._connectTimeout = QSS_CONNECT_TIMEOUT_INITIAL_MS
        socket.off('connect_error', onError)
        resolve()
      }

      const onError = (err: Error): void => {
        clearTimeout(timer)
        socket.off('connect', onConnect)
        this._closeSocket(socket)
        reject(new QSSConnectionError(`Client failed to connect: ${err.message}`, err as any))
      }

      socket.once('connect', onConnect)
      socket.once('connect_error', onError)
      socket.connect()
    })
  }

  private _attachSocketEventHandlers(socket: ClientSocket): void {
    this._detachSocketEventHandlers(socket)

    const onConnect = (): void => {
      this.logger.debug('QSS connected!', socket.id)
      this.emit(QSSEvents.QSS_CONNECTED)
      this.captchaVerified = false
    }

    const onDisconnect = (): void => {
      this.logger.debug('QSS disconnected!')
      this.emit(QSSEvents.QSS_DISCONNECTED)
      this.captchaVerified = false
      this._closeSocket(socket)
    }

    // forward Quiet websocket events from the socket connection to the client's own emitter
    const onAny = (eventName: string, ...args: any[]): void => {
      if (Object.values(WebsocketEvents).includes(eventName as any)) {
        this.emit(eventName, ...args)
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.onAny(onAny)
    this._socketEventHandlers = { socket, onConnect, onDisconnect, onAny }
  }

  private _detachSocketEventHandlers(socket: ClientSocket): void {
    if (this._socketEventHandlers?.socket !== socket) {
      return
    }

    socket.off('connect', this._socketEventHandlers.onConnect)
    socket.off('disconnect', this._socketEventHandlers.onDisconnect)
    socket.offAny(this._socketEventHandlers.onAny)
    this._socketEventHandlers = undefined
  }

  private _closeSocket(socket: ClientSocket): void {
    const wasCurrentSocket = this._clientSocket === socket
    const wasConnected = socket.connected

    this._detachSocketEventHandlers(socket)
    socket.close()

    if (wasCurrentSocket) {
      this._clientSocket = undefined
      this._clientSocketEndpoint = undefined
    }
    this.captchaVerified = false

    if (wasConnected) {
      this.emit(QSSEvents.QSS_DISCONNECTED)
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
  public async sendMessage<T extends BaseWebsocketMessage<object | undefined>>(
    event: WebsocketEvents,
    payload: object | undefined,
    withAck = false,
    timeoutAck: number = 5000
  ): Promise<T | undefined> {
    this.logger.debug(`Sending message`, event, `withAck: ${withAck}`)
    const socket = this.getClientSocket()
    try {
      if (!this.connected) {
        throw new QSSNotInitializedError(`Must run createSocket first!`)
      }
      if (withAck) {
        const response = (await socket!.timeout(timeoutAck).emitWithAck(event, payload)) as T
        this.handleErrors(response)
        return response
      }

      socket!.emit(event, payload)
    } catch (e) {
      this.logger.error('Error while sending message to QSS', e)
    }
    return undefined
  }

  public async getCaptchaSiteKey(): Promise<string | null> {
    this.logger.debug('Requesting hCaptcha site key from QSS')
    try {
      const response = await this.sendMessage<GetCaptchaSiteKeyResponse>(
        WebsocketEvents.GET_CAPTCHA_SITE_KEY,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
        },
        true,
        5000
      )
      this.logger.info('Received response from QSS for hCaptcha site key request')
      if (response?.status === CommunityOperationStatus.SUCCESS && response.payload?.siteKey) {
        this.logger.debug('Received hCaptcha site key from QSS')
        this.serverIoProvider.io.emit(SocketEvents.HCAPTCHA_SITE_KEY, response.payload.siteKey)
        return response.payload.siteKey
      } else {
        this.logger.warn(`Failed to get hCaptcha site key from QSS: ${response?.reason ?? 'no reason provided'}`)
        return null
      }
    } catch (e) {
      this.logger.error('Error while requesting hCaptcha site key from QSS', e)
      return null
    }
  }

  public async verifyCaptchaToken(token: string): Promise<boolean> {
    this.logger.debug('Verifying hCaptcha token with QSS')
    try {
      const response = await this.sendMessage<CaptchaVerifyResponse>(
        WebsocketEvents.VERIFY_CAPTCHA,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
          payload: { token },
        },
        true
      )
      if (response?.status === CommunityOperationStatus.SUCCESS) {
        this.captchaVerified = true
        this.serverIoProvider.io.emit(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, true)
        this.captchaService.hcaptchaToken = null
        this.logger.debug('hCaptcha token successfully verified with QSS')
        return true
      } else {
        this.logger.warn(`hCaptcha token verification with QSS failed: ${response?.reason ?? 'no reason provided'}`)
        this.serverIoProvider.io.emit(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, false)
        this.captchaVerified = false
        return false
      }
    } catch (e) {
      this.logger.error('Error while verifying hCaptcha token with QSS', e)
      this.serverIoProvider.io.emit(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, false)
      this.captchaVerified = false
      return false
    }
  }

  public async requestCaptchaVerification(): Promise<boolean> {
    if (this.captchaVerified) {
      this.logger.debug('Captcha already verified, skipping verification request')
      this.serverIoProvider.io.emit(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, true)
      return true
    }

    if (this._captchaVerificationPromise != null) {
      this.logger.debug('Captcha verification already in progress, awaiting existing verification')
      return this._captchaVerificationPromise
    }

    this._captchaVerificationPromise = this._requestCaptchaVerificationImpl()
    try {
      return await this._captchaVerificationPromise
    } finally {
      this._captchaVerificationPromise = null
    }
  }

  private async _requestCaptchaVerificationImpl(): Promise<boolean> {
    if (!this.connected) {
      await this.createSocketAndConnect(this.qssEndpoint)
    }

    const siteKey = await this.getCaptchaSiteKey()
    if (siteKey == null) {
      this.logger.warn('Cannot request captcha verification without a site key')
      return false
    }

    const token = await this.captchaService.getToken(siteKey)
    if (token == null) {
      this.logger.warn('Failed to obtain hCaptcha token for verification')
      return false
    }

    const verified = await this.verifyCaptchaToken(token)
    return verified
  }

  private handleErrors(response?: BaseWebsocketMessage<object | undefined>): void {
    if (response?.reason === CaptchaErrorMessages.CATCHA_VERIFICATION_REQUIRED) {
      this.captchaVerified = false
      this.emit(QSSEvents.QSS_CAPTCHA_REQUIRED)
    }
  }

  /**
   * Close our socket connection with QSS
   */
  public close(): void {
    const socket = this.getClientSocket()
    if (socket == null) {
      this.logger.verbose(`Client socket wasn't open!`)
      return
    }

    this.logger.info(`Closing client socket`)
    this._closeSocket(socket)
  }
}
