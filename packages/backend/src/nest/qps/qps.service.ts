import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { QPS_ALLOWED } from '../const'
import { SocketService } from '../socket/socket.service'
import { SocketActions } from '@quiet/types'
import { QPSRegisterResponse, QPSRegisterWsResponse } from './qps.types'
import { QSSClient } from '../qss/qss.client'
import { CommunityOperationStatus, QSSEvents, WebsocketEvents } from '../qss/qss.types'
import { SigChainService } from '../auth/sigchain.service'
import { RoleName } from '../auth/services/roles/roles'

const BUNDLE_ID = 'com.quietmobile'

@Injectable()
export class QPSService implements OnModuleInit {
  private readonly logger = createLogger('qps:service')
  private _pendingDeviceToken: string | null = null

  constructor(
    @Inject(QPS_ALLOWED) private readonly qpsAllowed: boolean,
    private readonly socketService: SocketService,
    private readonly qssClient: QSSClient,
    private readonly sigChainService: SigChainService
  ) {}

  public get enabled(): boolean {
    return this.qpsAllowed
  }

  private get ready(): boolean {
    return this.qssClient.connected && this._hasMemberKey()
  }

  onModuleInit() {
    this.socketService.on(SocketActions.SEND_DEVICE_TOKEN, async (payload: { deviceToken: string }) => {
      this.logger.info('Received device token from frontend')
      await this.register(payload.deviceToken)
    })

    this.qssClient.on(QSSEvents.QSS_CONNECTED, () => this._flushPendingToken())
    this.sigChainService.on('updated', () => this._flushPendingToken())
  }

  /**
   * Registers the device token with QPS
   * @param deviceToken
   * @returns
   */
  public async register(deviceToken: string): Promise<QPSRegisterResponse | null> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping registration')
      return null
    }

    if (!this.ready) {
      this.logger.info('QSS not connected or sigchain not joined, caching device token')
      this._pendingDeviceToken = deviceToken
      return null
    }

    return this._register(deviceToken)
  }

  private async _flushPendingToken(): Promise<void> {
    if (this._pendingDeviceToken == null || !this.ready) {
      return
    }

    const token = this._pendingDeviceToken
    this._pendingDeviceToken = null
    this.logger.info('Flushing cached device token')
    await this._register(token)
  }

  private _hasMemberKey(): boolean {
    try {
      return (
        this.sigChainService.activeChain?.team != null &&
        this.sigChainService.activeChain.roles.amIMemberOfRole(RoleName.MEMBER)
      )
    } catch {
      return false
    }
  }

  private async _register(deviceToken: string): Promise<QPSRegisterResponse | null> {
    this.logger.info('Registering device token')
    try {
      const response = await this.qssClient.sendMessage<QPSRegisterWsResponse>(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
          payload: { deviceToken, bundleId: BUNDLE_ID },
        },
        true
      )

      if (response?.status === CommunityOperationStatus.SUCCESS && response.payload?.ucan) {
        this.logger.info('QPS registration successful, received UCAN')
        return { ucan: response.payload.ucan }
      }

      this.logger.warn(`QPS registration failed: ${response?.reason ?? 'unknown'}`)
      return null
    } catch (e) {
      this.logger.error('Error registering device token', e)
      return null
    }
  }
}
