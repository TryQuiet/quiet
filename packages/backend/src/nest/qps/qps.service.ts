import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { createLogger } from '../common/logger'
import { QPS_ALLOWED, QPS_ENDPOINT } from '../const'
import { SocketService } from '../socket/socket.service'
import { SocketActions } from '@quiet/types'
import { QPSRegisterRequest, QPSRegisterResponse } from './qps.types'

const BUNDLE_ID = 'com.quietmobile'

@Injectable()
export class QPSService implements OnModuleInit {
  private readonly logger = createLogger('qps:service')

  constructor(
    @Inject(QPS_ALLOWED) private readonly qpsAllowed: boolean,
    @Inject(QPS_ENDPOINT) private readonly qpsEndpoint: string,
    private readonly socketService: SocketService
  ) {}

  public get enabled(): boolean {
    return this.qpsAllowed && this.qpsEndpoint != null && this.qpsEndpoint !== ''
  }

  onModuleInit() {
    this.socketService.on(SocketActions.SEND_DEVICE_TOKEN, async (payload: { deviceToken: string }) => {
      this.logger.info('Received device token from frontend')
      await this.register(payload.deviceToken)
    })
  }

  public async register(deviceToken: string): Promise<QPSRegisterResponse | null> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping registration')
      return null
    }

    const url = `${this.qpsEndpoint}/v1/register`
    const body: QPSRegisterRequest = { deviceToken, bundleId: BUNDLE_ID }

    this.logger.info('Registering device token with QPS')
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        this.logger.error(`QPS registration failed: ${response.status} ${response.statusText}`)
        return null
      }

      const data = (await response.json()) as QPSRegisterResponse
      this.logger.info('QPS registration successful, received UCAN')
      return data
    } catch (e) {
      this.logger.error('Error registering with QPS', e)
      return null
    }
  }
}
