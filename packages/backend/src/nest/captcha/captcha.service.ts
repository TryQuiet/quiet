import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { DateTime } from 'luxon'
import { HCaptchaFormResponse, HCaptchaRequest, SocketActions, SocketEvents } from '@quiet/types'
import { SocketService } from '../socket/socket.service'
import { createLogger } from '../common/logger'
import { QSS_ENDPOINT, SERVER_IO_PROVIDER } from '../const'
import { ServerIoProviderTypes } from '../types'

const logger = createLogger('CaptchaService')
@Injectable()
export class CaptchaService extends EventEmitter implements OnModuleInit {
  private _hcaptchaToken: { token: string; timestamp: number } | null = null
  private _hcaptchaWaiters: Array<(token: string | null) => void> = []
  private _hcaptchaRequestPending = false

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(QSS_ENDPOINT) private readonly qssEndpoint: string | undefined,
    private readonly socketService: SocketService
  ) {
    super()
  }

  async onModuleInit() {
    this.socketService.on(SocketActions.HCAPTCHA_FORM_RESPONSE, (payload: HCaptchaFormResponse) => {
      if (!payload.token) {
        logger.warn('Received empty hCaptcha token from client')
        this.hcaptchaToken = null
        return
      }
      this.hcaptchaToken = payload.token
    })
  }

  get hcaptchaRequestPending(): boolean {
    return this._hcaptchaRequestPending
  }

  get hcaptchaToken(): string | null {
    if (this._hcaptchaToken == null) {
      return null
    }

    // if the token is older than 2 minutes we should discard it
    const now = DateTime.utc().toMillis()
    if (now - this._hcaptchaToken.timestamp > 2 * 60 * 1000) {
      this._hcaptchaToken = null
      return null
    }

    return this._hcaptchaToken.token
  }

  set hcaptchaToken(token: string | null) {
    if (token == null) {
      this._hcaptchaToken = null
      this.flushHcaptchaWaiters(null)
      return
    }
    this._hcaptchaToken = {
      token,
      timestamp: DateTime.utc().toMillis(),
    }
    this.flushHcaptchaWaiters(token)
  }

  private flushHcaptchaWaiters(token: string | null) {
    if (this._hcaptchaWaiters.length === 0) {
      this._hcaptchaRequestPending = false
      return
    }

    const waiters = [...this._hcaptchaWaiters]
    this._hcaptchaWaiters = []
    this._hcaptchaRequestPending = false

    waiters.forEach(waiter => {
      try {
        waiter(token)
      } catch (error) {
        logger.error('Failed to notify hCaptcha waiter', error)
      }
    })
  }

  public handleHcaptchaError(message: string) {
    logger.warn(`hCaptcha verification failed: ${message}`)
    this._hcaptchaToken = null
    this.flushHcaptchaWaiters(null)
  }

  private async requestHcaptchaToken(siteKey: string): Promise<string | null> {
    const existing = this.hcaptchaToken
    if (existing) {
      return existing
    }

    logger.info('Requesting hCaptcha token from renderer process')

    return await new Promise(resolve => {
      const onToken = (token: string | null) => {
        resolve(token)
      }

      this._hcaptchaWaiters.push(onToken)

      if (!this._hcaptchaRequestPending) {
        this._hcaptchaRequestPending = true
        // desktop app: send IPC message to renderer
        process.send?.({ type: 'request-hcaptcha', siteKey })
        // mobile app: emit socket event to redux to show captcha modal
        this.serverIoProvider.io.emit(SocketEvents.HCAPTCHA_CHALLENGE_REQUEST, {})
      }
    })
  }

  public async getToken(siteKey: string): Promise<string | null> {
    const token = this.hcaptchaToken
    if (token) {
      return token
    }
    const received_token = await this.requestHcaptchaToken(siteKey)
    return received_token
  }

  public reset() {
    logger.info('Resetting hCaptcha token and pending requests')
    this._hcaptchaToken = null
    this.flushHcaptchaWaiters(null)
  }
}
