import { jest } from '@jest/globals'
import EventEmitter from 'events'
import { QPSService } from './qps.service'
import { CommunityOperationStatus, QSSEvents, WebsocketEvents } from '../qss/qss.types'
import { RoleName } from '../auth/services/roles/roles'
import { DateTime } from 'luxon'
import { JoinStatus } from '../libp2p/libp2p.auth'

/**
 * Lightweight mocks — avoid bootstrapping the full NestJS module graph.
 * QSSClient, QSSService, and SigChainService extend EventEmitter in production,
 * so the mocks do the same.
 */

class MockQSSClient extends EventEmitter {
  connected = false
  sendMessage = jest.fn<any>()
}

class MockSigChainService extends EventEmitter {
  activeChain: any = null
  user = { userId: 'test-user-id' }
  get team() {
    return this.activeChain?.team
  }
  getActiveChain(throwError = true) {
    if (this.activeChain == null) {
      if (!throwError) {
        return undefined
      }
      throw new Error('No active chain')
    }
    return this.activeChain
  }
}

class MockQSSService extends EventEmitter {
  on = this.addListener
  joinStatus = jest.fn<any>().mockReturnValue(JoinStatus.JOINED)
  emitEvent(event: QSSEvents, payload?: any) {
    this.emit(event, payload)
  }
}

class MockQSSSyncManager {
  waitForLogEntrySyncAck = jest.fn<any>().mockResolvedValue(undefined)
}

class MockSocketService extends EventEmitter {}

class MockNotificationTokensStore {
  addToken = jest.fn<any>()
  tombstoneUser = jest.fn<any>().mockResolvedValue('tombstone-hash')
  getAllEntries = jest.fn<any>().mockResolvedValue([])
}

describe('QPSService', () => {
  let qpsService: QPSService
  let qssClient: MockQSSClient
  let qssService: MockQSSService
  let qssSyncManager: MockQSSSyncManager
  let sigChainService: MockSigChainService
  let socketService: MockSocketService
  let notificationTokensStore: MockNotificationTokensStore

  const TOKEN = 'fake-device-token-abc123'
  const TEAM_ID = 'test-team-id'
  const DEVICE_TOKEN_PAYLOAD = {
    deviceToken: TOKEN,
    bundleId: 'com.quietmobile',
    platform: 'ios' as const,
  }

  const successResponse = {
    ts: DateTime.utc().toMillis(),
    status: CommunityOperationStatus.SUCCESS,
    payload: { ucan: 'test-ucan' },
  }

  const failureResponse = {
    ts: DateTime.utc().toMillis(),
    status: CommunityOperationStatus.ERROR,
    reason: 'QPS unavailable',
  }

  const pushSuccessResponse = {
    ts: DateTime.utc().toMillis(),
    status: CommunityOperationStatus.SUCCESS,
  }

  /** Helper: make QSS connected + sigchain joined */
  function setReady() {
    qssClient.connected = true
    sigChainService.activeChain = {
      team: { id: TEAM_ID },
      context: { user: sigChainService.user },
      user: sigChainService.user,
      roles: { amIMemberOfRole: (role: string) => role === RoleName.MEMBER },
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    qssClient = new MockQSSClient()
    qssService = new MockQSSService()
    qssSyncManager = new MockQSSSyncManager()
    sigChainService = new MockSigChainService()
    socketService = new MockSocketService()
    notificationTokensStore = new MockNotificationTokensStore()

    qpsService = new QPSService(
      true, // qpsAllowed
      socketService as any,
      qssClient as any,
      qssService as any,
      qssSyncManager as any,
      sigChainService as any,
      notificationTokensStore as any
    )

    qssClient.sendMessage.mockResolvedValue(successResponse)

    // Wire up event listeners (simulates NestJS lifecycle)
    qpsService.onModuleInit()
  })

  describe('register', () => {
    it('sends immediately when ready', async () => {
      setReady()

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result?.payload).toEqual({ ucan: 'test-ucan' })
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          status: CommunityOperationStatus.SENDING,
          payload: { ...DEVICE_TOKEN_PAYLOAD, teamId: TEAM_ID },
        }),
        true
      )
    })

    it('stores UCAN in notification tokens store after successful registration', async () => {
      setReady()

      await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(notificationTokensStore.addToken).toHaveBeenCalledWith('test-user-id', 'test-ucan')
    })

    it('clears cached token after successful immediate registration', async () => {
      setReady()

      await qpsService.register(DEVICE_TOKEN_PAYLOAD)
      qssService.emitEvent(QSSEvents.QSS_AUTH_JOINED, TEAM_ID)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    })

    it('caches token for retry when storing UCAN fails', async () => {
      setReady()
      notificationTokensStore.addToken.mockRejectedValueOnce(new Error('store not initialized'))

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBeUndefined()
      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(notificationTokensStore.addToken).toHaveBeenCalledTimes(1)

      qssService.emitEvent(QSSEvents.QSS_AUTH_JOINED, TEAM_ID)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(2)
      expect(notificationTokensStore.addToken).toHaveBeenCalledTimes(2)
      expect(notificationTokensStore.addToken).toHaveBeenLastCalledWith('test-user-id', 'test-ucan')
    })

    it('caches token for retry when immediate QSS registration fails', async () => {
      setReady()
      qssClient.sendMessage.mockResolvedValueOnce(failureResponse)

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBe(failureResponse)
      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(notificationTokensStore.addToken).not.toHaveBeenCalled()

      qssService.emitEvent(QSSEvents.QSS_AUTH_JOINED, TEAM_ID)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(2)
      expect(notificationTokensStore.addToken).toHaveBeenCalledWith('test-user-id', 'test-ucan')
    })

    it('caches token for retry when immediate QSS registration throws', async () => {
      setReady()
      qssClient.sendMessage.mockRejectedValueOnce(new Error('network down'))

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBeUndefined()
      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(notificationTokensStore.addToken).not.toHaveBeenCalled()

      qssService.emitEvent(QSSEvents.QSS_AUTH_JOINED, TEAM_ID)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(2)
      expect(notificationTokensStore.addToken).toHaveBeenCalledWith('test-user-id', 'test-ucan')
    })

    it('returns null and does not send when disabled', async () => {
      const disabled = new QPSService(
        false,
        socketService as any,
        qssClient as any,
        qssService as any,
        qssSyncManager as any,
        sigChainService as any,
        notificationTokensStore as any
      )
      setReady()

      const result = await disabled.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBeUndefined()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('caches token when QSS is not connected', async () => {
      qssClient.connected = false
      sigChainService.activeChain = {
        team: { id: TEAM_ID },
        roles: { amIMemberOfRole: () => true },
      }

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBeUndefined()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('caches token when sigchain has no member key', async () => {
      qssClient.connected = true
      sigChainService.activeChain = null

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBeUndefined()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('caches token when QSS auth is not joined for the active team', async () => {
      setReady()
      qssService.joinStatus.mockReturnValue(JoinStatus.NOT_STARTED)

      const result = await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      expect(result).toBeUndefined()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('overwrites cached token with latest value', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null

      await qpsService.register({ ...DEVICE_TOKEN_PAYLOAD, deviceToken: 'old-token' })
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      setReady()
      qssService.emitEvent(QSSEvents.QSS_FULLY_JOINED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          payload: { ...DEVICE_TOKEN_PAYLOAD, teamId: TEAM_ID },
        }),
        true
      )
    })
  })

  describe('flush on QSS_CONNECTED', () => {
    it('flushes cached token when QSS connects and sigchain is joined', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)
      expect(qssClient.sendMessage).not.toHaveBeenCalled()

      setReady()
      qssClient.emit(QSSEvents.QSS_CONNECTED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          payload: { ...DEVICE_TOKEN_PAYLOAD, teamId: TEAM_ID },
        }),
        true
      )
    })

    it('does not flush when QSS connects but sigchain is not joined', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      qssClient.connected = true
      qssClient.emit(QSSEvents.QSS_CONNECTED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('flush on QSS_AUTH_JOINED', () => {
    it('flushes cached token when QSS auth joins for the active team', async () => {
      qssClient.connected = true
      qssService.joinStatus.mockReturnValue(JoinStatus.NOT_STARTED)
      sigChainService.activeChain = null
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)
      expect(qssClient.sendMessage).not.toHaveBeenCalled()

      setReady()
      qssService.joinStatus.mockReturnValue(JoinStatus.JOINED)
      qssService.emitEvent(QSSEvents.QSS_AUTH_JOINED, TEAM_ID)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          payload: { ...DEVICE_TOKEN_PAYLOAD, teamId: TEAM_ID },
        }),
        true
      )
    })
  })

  describe('flush on QSS_FULLY_JOINED', () => {
    it('flushes cached token when QSS fully joins and QSS is connected', async () => {
      qssClient.connected = true
      sigChainService.activeChain = null
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)
      expect(qssClient.sendMessage).not.toHaveBeenCalled()

      setReady()
      qssService.emitEvent(QSSEvents.QSS_FULLY_JOINED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    })

    it('does not flush when QSS fully joins but QSS is not connected', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      sigChainService.activeChain = {
        team: { id: TEAM_ID },
        roles: { amIMemberOfRole: () => true },
      }
      qssService.emitEvent(QSSEvents.QSS_FULLY_JOINED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('flush clears cache', () => {
    it('does not send twice after flushing', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(DEVICE_TOKEN_PAYLOAD)

      setReady()
      qssService.emitEvent(QSSEvents.QSS_FULLY_JOINED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)

      qssService.emitEvent(QSSEvents.QSS_FULLY_JOINED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('tombstoneCurrentUserNotificationTokens', () => {
    beforeEach(() => {
      setReady()
    })

    it('writes a tombstone and waits for the matching QSS ack', async () => {
      await expect(qpsService.tombstoneCurrentUserNotificationTokens()).resolves.toBe(true)

      expect(notificationTokensStore.tombstoneUser).toHaveBeenCalledWith('test-user-id')
      expect(qssSyncManager.waitForLogEntrySyncAck).toHaveBeenCalledWith('tombstone-hash', 5000)
    })

    it('allows leave to continue if QSS is not connected', async () => {
      qssClient.connected = false

      await expect(qpsService.tombstoneCurrentUserNotificationTokens()).resolves.toBe(false)
      expect(notificationTokensStore.tombstoneUser).not.toHaveBeenCalled()
    })

    it('allows leave to continue if QSS auth is not joined', async () => {
      qssService.joinStatus.mockReturnValueOnce(JoinStatus.NOT_STARTED)

      await expect(qpsService.tombstoneCurrentUserNotificationTokens()).resolves.toBe(false)
      expect(notificationTokensStore.tombstoneUser).not.toHaveBeenCalled()
    })

    it('allows leave to continue if the QSS ack does not arrive before the timeout', async () => {
      qssSyncManager.waitForLogEntrySyncAck.mockRejectedValueOnce(new Error('Timed out waiting for QSS ack'))

      await expect(qpsService.tombstoneCurrentUserNotificationTokens()).resolves.toBe(false)

      expect(notificationTokensStore.tombstoneUser).toHaveBeenCalledWith('test-user-id')
      expect(qssSyncManager.waitForLogEntrySyncAck).toHaveBeenCalledWith('tombstone-hash', 5000)
    })

    it('allows leave to continue if writing the tombstone fails', async () => {
      notificationTokensStore.tombstoneUser.mockRejectedValueOnce(new Error('store unavailable'))

      await expect(qpsService.tombstoneCurrentUserNotificationTokens()).resolves.toBe(false)

      expect(qssSyncManager.waitForLogEntrySyncAck).not.toHaveBeenCalled()
    })
  })

  describe('sendBatchPush', () => {
    const UCANS = ['ucan-user-a', 'ucan-user-b']

    beforeEach(() => {
      qssClient.connected = true
      notificationTokensStore.getAllEntries.mockResolvedValue([
        { userId: 'user-a', tokens: ['ucan-user-a'] },
        { userId: 'user-b', tokens: ['ucan-user-b'] },
      ])
      qssClient.sendMessage.mockResolvedValue(pushSuccessResponse)
    })

    it('sends SEND_BATCH_PUSH with all UCANs when enabled and connected', async () => {
      await qpsService.sendBatchPush(TEAM_ID)

      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.SEND_BATCH_PUSH,
        expect.objectContaining({
          status: CommunityOperationStatus.SENDING,
          payload: expect.objectContaining({
            ucans: UCANS,
            data: { teamId: TEAM_ID },
          }),
        }),
        true
      )
    })

    it('skips when QPS is disabled', async () => {
      const disabled = new QPSService(
        false,
        socketService as any,
        qssClient as any,
        qssService as any,
        qssSyncManager as any,
        sigChainService as any,
        notificationTokensStore as any
      )

      await disabled.sendBatchPush(TEAM_ID)

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('skips when QSS is not connected', async () => {
      qssClient.connected = false

      await qpsService.sendBatchPush(TEAM_ID)

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('skips when no UCANs are registered', async () => {
      notificationTokensStore.getAllEntries.mockResolvedValue([])

      await qpsService.sendBatchPush(TEAM_ID)

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('logs warning on non-success response', async () => {
      qssClient.sendMessage.mockResolvedValueOnce({
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.ERROR,
        reason: 'server error',
      })

      await expect(qpsService.sendBatchPush(TEAM_ID)).resolves.toBeUndefined()
      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    })

    it('handles thrown errors gracefully', async () => {
      qssClient.sendMessage.mockRejectedValueOnce(new Error('network error'))

      await expect(qpsService.sendBatchPush(TEAM_ID)).resolves.toBeUndefined()
    })

    it('sends multiple batches when UCANs exceed batch size', async () => {
      const manyUcans = Array.from({ length: 550 }, (_, i) => `ucan-${i}`)
      notificationTokensStore.getAllEntries.mockResolvedValue([{ userId: 'user-a', tokens: manyUcans }])

      await qpsService.sendBatchPush(TEAM_ID)

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(2)
      expect(qssClient.sendMessage).toHaveBeenNthCalledWith(
        1,
        WebsocketEvents.SEND_BATCH_PUSH,
        expect.objectContaining({
          payload: expect.objectContaining({
            ucans: manyUcans.slice(0, 500),
            data: { teamId: TEAM_ID },
          }),
        }),
        true
      )
      expect(qssClient.sendMessage).toHaveBeenNthCalledWith(
        2,
        WebsocketEvents.SEND_BATCH_PUSH,
        expect.objectContaining({
          payload: expect.objectContaining({
            ucans: manyUcans.slice(500),
            data: { teamId: TEAM_ID },
          }),
        }),
        true
      )
    })

    it('continues remaining batches if one batch throws', async () => {
      const manyUcans = Array.from({ length: 550 }, (_, i) => `ucan-${i}`)
      notificationTokensStore.getAllEntries.mockResolvedValue([{ userId: 'user-a', tokens: manyUcans }])
      qssClient.sendMessage.mockRejectedValueOnce(new Error('network error'))

      await expect(qpsService.sendBatchPush(TEAM_ID)).resolves.toBeUndefined()
      expect(qssClient.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('QSS_LOG_SYNCED event fires sendBatchPush', async () => {
      const sendBatchPushSpy = jest.spyOn(qpsService, 'sendBatchPush').mockResolvedValue()

      qssClient.emit(QSSEvents.QSS_LOG_SYNCED, TEAM_ID)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(sendBatchPushSpy).toHaveBeenCalledWith(TEAM_ID)
    })
  })

  describe('sendPush', () => {
    beforeEach(() => {
      qssClient.connected = true
      qssClient.sendMessage.mockResolvedValue(pushSuccessResponse)
    })

    it('skips single push when QSS is not connected', async () => {
      qssClient.connected = false

      await qpsService.sendPush('ucan-user-a', 'title', 'body', { cid: 'cid-1' })

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })
  })
})
