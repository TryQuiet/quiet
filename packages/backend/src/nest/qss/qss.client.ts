/**
 * QSS websocket client wrapper
 */
import { Inject, Injectable } from '@nestjs/common'
import { connect, type Socket as ClientSocket } from 'socket.io-client'
import { DateTime } from 'luxon'

import { createLogger } from '../common/logger'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../const'
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
import { sleep } from '../common/sleep'
import { CLIENT_TRANSPORTS } from './qss.const'
import { CaptchaErrorMessages, CompoundError } from '@quiet/types'
import EventEmitter from 'node:events'
import { CaptchaService } from '../captcha/captcha.service'

@Injectable()
export class QSSClient extends EventEmitter {
  /**
   * Socket.io socket instance
   */
  private _clientSocket: ClientSocket | undefined = undefined
  private _captchaVerified = false

  private readonly logger = createLogger(`qss:client`)

  constructor(
    // environment variable that determines if we are using QSS
    @Inject(QSS_ALLOWED) private qssAllowed: boolean,
    // environment variable that determines what endpoint we connect to QSS on
    @Inject(QSS_ENDPOINT) private qssEndpoint: string,
    private readonly captchaService: CaptchaService
  ) {
    super()
  }

  public get connected(): boolean {
    const socket = this.getClientSocket()
    return socket != null && socket.active && socket.connected
  }

  public get captchaVerified(): boolean {
    return this._captchaVerified
  }

  private set captchaVerified(value: boolean) {
    this._captchaVerified = value
    if (value) {
      this.emit(QSSEvents.QSS_CAPTCHA_VERIFIED, value)
    }
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
      this.captchaVerified = false
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
  public async sendMessage<T extends BaseWebsocketMessage<object | undefined>>(
    event: WebsocketEvents,
    payload: object | undefined,
    withAck = false
  ): Promise<T | undefined> {
    this.logger.debug(`Sending message`, event)
    const socket = this.getClientSocket()
    try {
      if (!this.connected) {
        throw new QSSNotInitializedError(`Must run createSocket first!`)
      }
      if (withAck) {
        const response = (await socket!.emitWithAck(event, payload)) as T
        if (response?.reason === CaptchaErrorMessages.CATCHA_VERIFICATION_REQUIRED) {
          this.captchaVerified = false
          void this.requestCaptchaVerification().catch(error => {
            this.logger.error('Failed to request captcha verification after captcha requirement', error)
          })
        }
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
        true
      )
      if (response?.status === CommunityOperationStatus.SUCCESS && response.payload?.siteKey) {
        this.logger.debug('Received hCaptcha site key from QSS')
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

  public async verifyCaptchaToken(): Promise<boolean> {
    if (this.captchaVerified) {
      this.logger.debug('Captcha token already verified')
      return true
    }

    if (!this.captchaService.hcaptchaToken) {
      this.logger.debug('No hCaptcha token available to verify')
      this.captchaVerified = false
      return false
    }

    if (!this.connected) {
      this.logger.debug('QSS client not connected, cannot verify hCaptcha token')
      this.captchaVerified = false
      return false
    }

    this.logger.debug('Verifying hCaptcha token with QSS')
    try {
      const response = await this.sendMessage<CaptchaVerifyResponse>(
        WebsocketEvents.VERIFY_CAPTCHA,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
          payload: { token: this.captchaService.hcaptchaToken },
        },
        true
      )
      if (response?.status === CommunityOperationStatus.SUCCESS) {
        this.captchaVerified = true
        this.captchaService.hcaptchaToken = null
        this.logger.debug('hCaptcha token successfully verified with QSS')
        return true
      } else {
        this.logger.warn(`hCaptcha token verification with QSS failed: ${response?.reason ?? 'no reason provided'}`)
        this.captchaVerified = false
        return false
      }
    } catch (e) {
      this.logger.error('Error while verifying hCaptcha token with QSS', e)
      this.captchaVerified = false
      return false
    }
  }

  public async requestCaptchaVerification(): Promise<boolean> {
    this.captchaVerified = false
    const siteKey = await this.getCaptchaSiteKey()
    if (siteKey == null) {
      this.logger.warn('Cannot request captcha verification without a site key')
      return false
    }

    const token = await this.captchaService.ensureHcaptchaToken(siteKey)
    if (token == null) {
      this.logger.warn('Failed to obtain hCaptcha token for verification')
      return false
    }

    const verified = await this.verifyCaptchaToken()
    return verified
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
