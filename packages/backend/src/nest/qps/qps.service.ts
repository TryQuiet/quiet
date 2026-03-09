import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { QPS_ALLOWED } from '../const'
import { SocketService } from '../socket/socket.service'
import { SocketActions } from '@quiet/types'
import { QPSRegisterResponse, QPSRegisterWsResponse } from './qps.types'
import { QSSClient } from '../qss/qss.client'
import {
  CommunityOperationStatus,
  QSSEvents,
  SendBatchPushResponse,
  SendPushResponse,
  WebsocketEvents,
} from '../qss/qss.types'
import { SigChainService } from '../auth/sigchain.service'
import { RoleName } from '../auth/services/roles/roles'
import { NotificationTokensStore } from '../storage/notifications/notificationTokens.store'

const BUNDLE_ID = 'com.quietmobile'
const PUSH_BATCH_SIZE = 500 // FCM allows up to 500 tokens per batch request

@Injectable()
export class QPSService implements OnModuleInit {
  private readonly logger = createLogger('qps:service')
  private _pendingDeviceToken: string | undefined = undefined

  constructor(
    @Inject(QPS_ALLOWED) private readonly qpsAllowed: boolean,
    private readonly socketService: SocketService,
    private readonly qssClient: QSSClient,
    private readonly sigChainService: SigChainService,
    private readonly notificationTokensStore: NotificationTokensStore
  ) {}

  public get enabled(): boolean {
    return true
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
    this.qssClient.on(QSSEvents.QSS_LOG_SYNCED, (teamId: string) => void this.sendBatchPush(teamId))
  }

  /**
   * Registers the device token with QPS
   * @param deviceToken
   * @returns
   */
  public async register(deviceToken: string): Promise<QPSRegisterResponse | undefined> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping registration')
      return undefined
    }

    if (!this.ready) {
      this.logger.info('QSS not connected or sigchain not joined, caching device token')
      this._pendingDeviceToken = deviceToken
      return undefined
    }

    return this._register(deviceToken)
  }

  private async _flushPendingToken(): Promise<void> {
    if (this._pendingDeviceToken == undefined || !this.ready) {
      return
    }

    const token = this._pendingDeviceToken
    this._pendingDeviceToken = undefined
    this.logger.info('Flushing cached device token')
    await this._register(token)
  }

  private _hasMemberKey(): boolean {
    try {
      return (
        this.sigChainService.activeChain?.team != undefined &&
        this.sigChainService.activeChain.roles.amIMemberOfRole(RoleName.MEMBER)
      )
    } catch {
      return false
    }
  }

  public async sendBatchPush(
    teamId: string,
    title?: string,
    body?: string,
    data?: Record<string, string>
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping push trigger')
      return
    }

    if (!this.qssClient.connected) {
      this.logger.warn('QSS not connected, skipping push trigger')
      return
    }

    const allTokens = await this.notificationTokensStore.getAllEntries()
    const ucans = allTokens.flatMap(t => t.tokens)
    if (ucans.length === 0) {
      this.logger.info('No registered device UCANs, skipping push trigger')
      return
    }

    const batches: string[][] = []
    for (let i = 0; i < ucans.length; i += PUSH_BATCH_SIZE) {
      batches.push(ucans.slice(i, i + PUSH_BATCH_SIZE))
    }

    this.logger.info(
      `Triggering push notifications for team ${teamId} with ${ucans.length} UCAN(s) in ${batches.length} batch(es)`
    )
    for (const [index, batch] of batches.entries()) {
      try {
        const response = await this.qssClient.sendMessage<SendBatchPushResponse>(
          WebsocketEvents.SEND_BATCH_PUSH,
          {
            ts: DateTime.utc().toMillis(),
            status: CommunityOperationStatus.SENDING,
            payload: { ucans: batch, title, body, data },
          },
          true
        )
        if (response?.status !== CommunityOperationStatus.SUCCESS) {
          this.logger.warn(`Push trigger batch ${index + 1}/${batches.length} failed: ${response?.reason ?? 'unknown'}`)
        } else {
          this.logger.info(`Push trigger batch ${index + 1}/${batches.length} successful`)
        }
      } catch (e) {
        this.logger.error(`Error triggering push notification batch ${index + 1}/${batches.length}`, e)
      }
    }
  }

  public async sendPush(
    ucan: string,
    title?: string,
    body?: string,
    data?: Record<string, string>
  ): Promise<SendPushResponse | undefined> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping push')
      return undefined
    }

    if (!this.qssClient.connected) {
      this.logger.warn('QSS not connected, skipping push')
      return undefined
    }

    try {
      return await this.qssClient.sendMessage<SendPushResponse>(
        WebsocketEvents.SEND_PUSH,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
          payload: { ucan, title, body, data },
        },
        true
      )
    } catch (e) {
      this.logger.error('Error sending push notification', e)
      return undefined
    }
  }

  private async _register(deviceToken: string): Promise<QPSRegisterResponse | undefined> {
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
        try {
          const userId = this.sigChainService.user.userId
          await this.notificationTokensStore.addToken(userId, response.payload.ucan)
        } catch (err) {
          this.logger.error('Failed to store UCAN in notification tokens store', err)
        }
        return response
      }

      this.logger.warn(`QPS registration failed: ${response?.reason ?? 'unknown'}`)
      return response
    } catch (e) {
      this.logger.error('Error registering device token', e)
      return undefined
    }
  }
}
