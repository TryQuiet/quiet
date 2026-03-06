import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { QPS_ALLOWED } from '../const'
import { SocketService } from '../socket/socket.service'
import { SocketActions } from '@quiet/types'
import { QPSRegisterResponse } from './qps.types'
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
  private _flushInterval: ReturnType<typeof setInterval> | undefined = undefined
  private _registering = false
  private readonly FLUSH_INTERVAL_MS = 5000

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

    this.qssClient.on(QSSEvents.QSS_LOG_SYNCED, (teamId: string) => void this.sendBatchPush(teamId))
  }

  /**
   * Registers the device token with QPS
   * @param deviceToken
   * @returns
   */
  public async register(deviceToken: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping registration')
      return
    }

    this._pendingDeviceToken = deviceToken
    this._startFlushInterval()
    await this._flushPendingToken()
  }

  private _startFlushInterval(): void {
    if (this._flushInterval != null) return
    this.logger.info('Starting flush interval')
    this._flushInterval = setInterval(() => void this._flushPendingToken(), this.FLUSH_INTERVAL_MS)
  }

  private _stopFlushInterval(): void {
    if (this._flushInterval == null) return
    this.logger.info('Stopping flush interval')
    clearInterval(this._flushInterval)
    this._flushInterval = undefined
  }

  private async _flushPendingToken(): Promise<void> {
    if (this._pendingDeviceToken == undefined || !this.ready || this._registering) return

    this._registering = true
    try {
      await this._register(this._pendingDeviceToken)
    } finally {
      this._registering = false
    }
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
    let response: QPSRegisterResponse | undefined = undefined
    try {
      response = await this.qssClient.sendMessage<QPSRegisterResponse>(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
          payload: { deviceToken, bundleId: BUNDLE_ID, teamId: this.sigChainService.team.id },
        },
        true
      )

      if (response?.status === CommunityOperationStatus.SUCCESS && response.payload?.ucan) {
        this.logger.info('QPS registration successful, received UCAN')
        this._pendingDeviceToken = undefined
        this._stopFlushInterval()
        try {
          const userId = this.sigChainService.user.userId
          await this.notificationTokensStore.addToken(userId, response.payload.ucan)
        } catch (err) {
          this.logger.warn('Failed to store UCAN in notification tokens store', err)
        }
        return response
      }

      this.logger.warn(`QPS registration failed: ${response?.reason ?? 'unknown'}`)
    } catch (e) {
      this.logger.error('Error registering device token', e)
    }
    return response
  }
}
