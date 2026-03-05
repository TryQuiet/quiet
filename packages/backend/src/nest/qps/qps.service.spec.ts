import { jest } from '@jest/globals'
import EventEmitter from 'events'
import { QPSService } from './qps.service'
import { CommunityOperationStatus, QSSEvents, WebsocketEvents } from '../qss/qss.types'
import { RoleName } from '../auth/services/roles/roles'
import { DateTime } from 'luxon'

/**
 * Lightweight mocks — avoid bootstrapping the full NestJS module graph.
 * QSSClient and SigChainService both extend EventEmitter in production,
 * so the mocks do the same.
 */

class MockQSSClient extends EventEmitter {
  connected = false
  sendMessage = jest.fn<any>()
}

class MockSigChainService extends EventEmitter {
  activeChain: any = null
  user = { userId: 'test-user-id' }
}

class MockSocketService extends EventEmitter {}

class MockNotificationTokensStore {
  addToken = jest.fn<any>()
}

describe('QPSService', () => {
  let qpsService: QPSService
  let qssClient: MockQSSClient
  let sigChainService: MockSigChainService
  let socketService: MockSocketService
  let notificationTokensStore: MockNotificationTokensStore

  const TOKEN = 'fake-device-token-abc123'

  const successResponse = {
    ts: DateTime.utc().toMillis(),
    status: CommunityOperationStatus.SUCCESS,
    payload: { ucan: 'test-ucan' },
  }

  /** Helper: make QSS connected + sigchain joined */
  function setReady() {
    qssClient.connected = true
    sigChainService.activeChain = {
      team: {},
      roles: { amIMemberOfRole: (role: string) => role === RoleName.MEMBER },
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    qssClient = new MockQSSClient()
    sigChainService = new MockSigChainService()
    socketService = new MockSocketService()
    notificationTokensStore = new MockNotificationTokensStore()

    qpsService = new QPSService(
      true, // qpsAllowed
      socketService as any,
      qssClient as any,
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

      const result = await qpsService.register(TOKEN)

      expect(result).toEqual({ ucan: 'test-ucan' })
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          status: CommunityOperationStatus.SENDING,
          payload: { deviceToken: TOKEN, bundleId: 'com.quietmobile' },
        }),
        true
      )
    })

    it('stores UCAN in notification tokens store after successful registration', async () => {
      setReady()

      await qpsService.register(TOKEN)

      expect(notificationTokensStore.addToken).toHaveBeenCalledWith('test-user-id', 'test-ucan')
    })

    it('still returns UCAN if storing in notification tokens store fails', async () => {
      setReady()
      notificationTokensStore.addToken.mockRejectedValueOnce(new Error('store not initialized'))

      const result = await qpsService.register(TOKEN)

      expect(result).toEqual({ ucan: 'test-ucan' })
      expect(notificationTokensStore.addToken).toHaveBeenCalledWith('test-user-id', 'test-ucan')
    })

    it('returns null and does not send when disabled', async () => {
      // Create a disabled instance
      const disabled = new QPSService(
        false,
        socketService as any,
        qssClient as any,
        sigChainService as any,
        notificationTokensStore as any
      )
      setReady()

      const result = await disabled.register(TOKEN)

      expect(result).toBeNull()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('caches token when QSS is not connected', async () => {
      qssClient.connected = false
      sigChainService.activeChain = {
        team: {},
        roles: { amIMemberOfRole: () => true },
      }

      const result = await qpsService.register(TOKEN)

      expect(result).toBeNull()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('caches token when sigchain has no member key', async () => {
      qssClient.connected = true
      sigChainService.activeChain = null

      const result = await qpsService.register(TOKEN)

      expect(result).toBeNull()
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })

    it('overwrites cached token with latest value', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null

      await qpsService.register('old-token')
      await qpsService.register(TOKEN)

      // Now become ready and flush
      setReady()
      qssClient.emit(QSSEvents.QSS_CONNECTED)

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          payload: { deviceToken: TOKEN, bundleId: 'com.quietmobile' },
        }),
        true
      )
    })
  })

  describe('flush on QSS_CONNECTED', () => {
    it('flushes cached token when QSS connects and sigchain is joined', async () => {
      // Cache token while not ready
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(TOKEN)
      expect(qssClient.sendMessage).not.toHaveBeenCalled()

      // Become ready and emit connected
      setReady()
      qssClient.emit(QSSEvents.QSS_CONNECTED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.REGISTER_DEVICE_TOKEN,
        expect.objectContaining({
          payload: { deviceToken: TOKEN, bundleId: 'com.quietmobile' },
        }),
        true
      )
    })

    it('does not flush when QSS connects but sigchain is not joined', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(TOKEN)

      // QSS connects but sigchain still not joined
      qssClient.connected = true
      qssClient.emit(QSSEvents.QSS_CONNECTED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('flush on sigchain updated', () => {
    it('flushes cached token when sigchain joins and QSS is connected', async () => {
      // Cache token: QSS connected but no sigchain
      qssClient.connected = true
      sigChainService.activeChain = null
      await qpsService.register(TOKEN)
      expect(qssClient.sendMessage).not.toHaveBeenCalled()

      // Sigchain joins
      setReady()
      sigChainService.emit('updated')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    })

    it('does not flush when sigchain updates but QSS is not connected', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(TOKEN)

      // Sigchain joins but QSS still disconnected
      sigChainService.activeChain = {
        team: {},
        roles: { amIMemberOfRole: () => true },
      }
      sigChainService.emit('updated')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('flush clears cache', () => {
    it('does not send twice after flushing', async () => {
      qssClient.connected = false
      sigChainService.activeChain = null
      await qpsService.register(TOKEN)

      setReady()
      qssClient.emit(QSSEvents.QSS_CONNECTED)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)

      // Second event should not trigger another send
      sigChainService.emit('updated')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    })
  })
})
