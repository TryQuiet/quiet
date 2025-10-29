import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { DateTime } from 'luxon'
import { SocketActions, SocketEvents } from '@quiet/types'
import SocketService from '../socket/socket.service'

@Injectable()
export class CaptchaService extends EventEmitter implements OnModuleInit {
  private readonly hcaptchaRequestTimeoutMs = 30 * 1000 // 30 seconds

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
    this.socketService.on(SocketEvents.HCAPTCHA_FORM_RESPONSE, (payload: HCaptchaFormResponse) => {
      if (!payload.token) {
        this.logger.warn('Received empty hCaptcha token from client')
        this.hcaptchaToken = null
        return
      }
      this.hcaptchaToken = payload.token
    })
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
        this.logger.error('Failed to notify hCaptcha waiter', error)
      }
    })
  }

  public handleHcaptchaError(message: string) {
    this.logger.warn(`hCaptcha verification failed: ${message}`)
    this._hcaptchaToken = null
    this.flushHcaptchaWaiters(null)
  }

  private async requestHcaptchaToken(): Promise<string | null> {
    const existing = this.hcaptchaToken
    if (existing) {
      return existing
    }

    this.logger.info('Requesting hCaptcha token from renderer process')
    if (!process.send) {
      this.logger.warn('Cannot request hCaptcha token: IPC channel unavailable')
      return null
    }

    return await new Promise(resolve => {
      const onToken = (token: string | null) => {
        clearTimeout(timeoutId)
        resolve(token)
      }

      const timeoutId = setTimeout(() => {
        this._hcaptchaWaiters = this._hcaptchaWaiters.filter(waiter => waiter !== onToken)
        this._hcaptchaRequestPending = false
        resolve(null)
      }, this.hcaptchaRequestTimeoutMs)

      this._hcaptchaWaiters.push(onToken)

      if (!this._hcaptchaRequestPending) {
        this._hcaptchaRequestPending = true
        process.send?.({ type: 'request-hcaptcha' })
        this.serverIoProvider.emit(SocketActions.HCAPTCHA_REQUEST)
      }
    })
  }

  private async ensureHcaptchaToken(): Promise<string | null> {
    const token = this.hcaptchaToken
    if (token) {
      return token
    }
    const received_token = await this.requestHcaptchaToken()
    this.logger.info('Received hCaptcha token from renderer', received_token)
    return received_token
  }

  private async getSiteKey(): Promise<string | null> {
    if (process.env.HCAPTCHA_SITE_KEY) {
      return process.env.HCAPTCHA_SITE_KEY
    }

    if (!this.qssEndpoint) {
      this.logger.warn('No QSS endpoint configured, cannot get hCaptcha site key')
      return null
    }

    try {
      const response = await fetch(`${this.qssEndpoint}/captcha/sitekey`)
      if (!response.ok) {
        this.logger.warn(`Failed to get hCaptcha site key: ${response.status} ${response.statusText}`)
        return null
      }
      const data = await response.json()
      return data.siteKey
    } catch (error) {
      this.logger.error('Error fetching hCaptcha site key', error)
      return null
    }
  }
}
