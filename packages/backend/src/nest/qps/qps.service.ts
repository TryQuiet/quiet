import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { QPS_ALLOWED } from '../const'
import { SocketService } from '../socket/socket.service'
import { SocketActions } from '@quiet/types'
import { QPSRegisterMessage, QPSRegisterResponse } from './qps.types'
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
import { QSSService } from '../qss/qss.service'
import { SigchainEvents } from '../auth/types'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { Base58 } from '3rd-party/auth/packages/crypto/dist'

const PUSH_BATCH_SIZE = 500 // FCM allows up to 500 tokens per batch request
const LEAVE_TOMBSTONE_ACK_TIMEOUT_MS = 5_000

interface DeviceTokenPayload {
  deviceToken: string
  bundleId: string
  platform: 'ios' | 'android'
}

@Injectable()
export class QPSService implements OnModuleInit {
  private readonly logger = createLogger('qps:service')
  private _pendingDeviceToken: DeviceTokenPayload | undefined = undefined

  constructor(
    @Inject(QPS_ALLOWED) private readonly qpsAllowed: boolean,
    private readonly socketService: SocketService,
    private readonly qssClient: QSSClient,
    private readonly qssService: QSSService,
    private readonly sigChainService: SigChainService,
    private readonly notificationTokensStore: NotificationTokensStore
  ) {}

  public get enabled(): boolean {
    return this.qpsAllowed
  }

  private get ready(): boolean {
    return this.qssClient.connected && this._hasMemberKey()
  }

  onModuleInit() {
    this.socketService.on(SocketActions.SEND_DEVICE_TOKEN, async (payload: DeviceTokenPayload) => {
      this.logger.info('Received device token from frontend')
      await this.register(payload)
    })

    this.qssService.on(QSSEvents.QSS_FULLY_JOINED, () => this._flushPendingToken())
    this.qssClient.on(QSSEvents.QSS_CONNECTED, () => this._flushPendingToken())
    this.qssClient.on(QSSEvents.QSS_LOG_SYNCED, (teamId: string) => void this.sendBatchPush(teamId))
    this.sigChainService.on(SigchainEvents.UPDATED, () => this._flushPendingToken())
  }

  /**
   * Registers the device token with QPS
   * @param payload
   * @returns
   */
  public async register(payload: DeviceTokenPayload): Promise<QPSRegisterResponse | undefined> {
    if (!this.enabled) {
      this.logger.warn('QPS not enabled, skipping registration')
      return undefined
    }

    if (!this.ready) {
      this.logger.info('QSS not connected or sigchain not joined, caching device token')
      this._pendingDeviceToken = payload
      return undefined
    }

    return this._register(payload)
  }

  public async tombstoneCurrentUserNotificationTokens(): Promise<boolean> {
    if (!this.enabled) {
      this.logger.info('QPS not enabled, skipping notification token tombstone')
      this._pendingDeviceToken = undefined
      return true
    }

    let teamId: Base58 | undefined
    let userId: string | undefined
    try {
      const sigchain = this.sigChainService.getActiveChain()
      teamId = sigchain?.team?.id
      userId = sigchain.context.user.userId
    } catch (e) {
      this.logger.warn('Cannot tombstone notification tokens before leave: no active team chain')
      this._pendingDeviceToken = undefined
      return false
    }
    if (teamId == null) {
      this.logger.warn('Cannot tombstone notification tokens before leave: no active team id')
      this._pendingDeviceToken = undefined
      return false
    }

    if (!this.qssClient.connected) {
      this.logger.warn(`Cannot tombstone notification tokens before leave: QSS is not connected for team ${teamId}`)
      this._pendingDeviceToken = undefined
      return false
    }

    if (this.qssService.joinStatus(teamId) !== JoinStatus.JOINED) {
      this.logger.warn(`Cannot tombstone notification tokens before leave: QSS auth is not joined for team ${teamId}`)
      this._pendingDeviceToken = undefined
      return false
    }

    if (!this._hasMemberKey()) {
      this.logger.warn(`Cannot tombstone notification tokens before leave: member key unavailable for team ${teamId}`)
      this._pendingDeviceToken = undefined
      return false
    }

    try {
      this.logger.info(`Tombstoning notification tokens before leave for user ${userId} on team ${teamId}`)
      const tombstoneHash = await this.notificationTokensStore.tombstoneUser(userId)

      try {
        await this.qssService.waitForLogEntrySyncAck(tombstoneHash, LEAVE_TOMBSTONE_ACK_TIMEOUT_MS)
        this.logger.info(`Notification token tombstone acknowledged by QSS for user ${userId} on team ${teamId}`)
        return true
      } catch (err) {
        this.logger.warn(
          `Notification token tombstone was not acknowledged within ${LEAVE_TOMBSTONE_ACK_TIMEOUT_MS}ms for user ${userId} on team ${teamId}; continuing leave`,
          err
        )
        return false
      }
    } catch (err) {
      this.logger.warn(`Failed to tombstone notification tokens before leave for user ${userId} on team ${teamId}`, err)
      return false
    } finally {
      this._pendingDeviceToken = undefined
    }
  }

  private async _flushPendingToken(): Promise<void> {
    this.logger.debug('Checking if pending device token can be flushed')
    const hasPendingToken = this._pendingDeviceToken != undefined
    const qssConnected = this.qssClient.connected
    const hasMemberKey = this._hasMemberKey()

    if (!hasPendingToken || !qssConnected || !hasMemberKey) {
      const reasons: string[] = []
      if (!hasPendingToken) {
        reasons.push('no pending device token')
      }
      if (!qssConnected) {
        reasons.push('QSS not connected')
      }
      if (!hasMemberKey) {
        reasons.push('sigchain member key unavailable')
      }

      this.logger.debug(`Skipping cached device token flush: ${reasons.join(', ')}`)
      return
    }

    if (!this._pendingDeviceToken) {
      this.logger.warn('No pending device token found during flush')
      return
    }

    const token = this._pendingDeviceToken
    this._pendingDeviceToken = undefined
    this.logger.info('Flushing cached device token')
    const response = await this._register(token)
    if (response == null || response.status !== CommunityOperationStatus.SUCCESS) {
      this.logger.warn('Failed to register cached device token')
      this._pendingDeviceToken = token // keep the token cached for future retry
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

    const mergedData: Record<string, string> = {
      teamId,
      ...data,
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
            payload: { ucans: batch, title, body, data: mergedData },
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

  private async _register(payload: DeviceTokenPayload): Promise<QPSRegisterResponse | undefined> {
    this.logger.info('Registering device token')
    try {
      const response = await this.qssClient.sendMessage<QPSRegisterResponse>(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        {
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SENDING,
          payload: {
            deviceToken: payload.deviceToken,
            bundleId: payload.bundleId,
            platform: payload.platform,
            teamId: this.sigChainService.team.id,
          },
        } satisfies QPSRegisterMessage,
        true
      )

      if (response?.status === CommunityOperationStatus.SUCCESS && response.payload?.ucan) {
        this.logger.info('QPS registration successful, received UCAN')
        try {
          const userId = this.sigChainService.user.userId
          await this.notificationTokensStore.addToken(userId, response.payload.ucan)
        } catch (err) {
          this.logger.error('Failed to store UCAN in notification tokens store', err)
          return response
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
