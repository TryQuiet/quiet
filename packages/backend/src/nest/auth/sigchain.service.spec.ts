import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { SigChainService } from './sigchain.service'
import { createLogger } from '../common/logger'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { TestModule } from '../common/test.module'
import { SigChainModule } from './sigchain.service.module'
import { SigChain } from './sigchain'
import { SocketEvents } from '@quiet/types'
import waitForExpect from 'wait-for-expect'
import { SigchainEvents } from './types'

const logger = createLogger('auth:sigchainManager.spec')

describe('SigChainService', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService
  let handleChainUpdateSpy: jest.SpiedFunction<any>
  let sigChainTest: SigChain
  let sigChainTest2: SigChain
  let sigChainTest3: SigChain

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    handleChainUpdateSpy = jest.spyOn(sigChainService as any, 'handleChainUpdate').mockImplementation(() => {
      logger.debug('MOCK: handling chain update')
    })
  })

  beforeEach(async () => {
    if (localDbService.getStatus() === 'closed') {
      await localDbService.open()
    }
  })

  afterAll(async () => {
    handleChainUpdateSpy.mockReset()
    await localDbService.close()
    await module.close()
  })

  it('should throw an error when trying to get an active chain without setting one', async () => {
    expect(() => sigChainService.getActiveChain()).toThrowError()
  })
  it('should throw an error when trying to set an active chain that does not exist', async () => {
    expect(() => sigChainService.setActiveChain('nonexistent')).toThrowError()
  })
  it('should add a new chain and it not be active if not set to be', async () => {
    sigChainTest = await sigChainService.createChain(false)
    expect(() => sigChainService.getActiveChain()).toThrowError()
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    sigChainService.setActiveChain(sigChainTest.teamId!)
    expect(sigChainService.getActiveChain()).toBe(sigChainTest)
  })
  it('should add a new chain and it be active if set to be', async () => {
    sigChainTest2 = await sigChainService.createChain(true)
    expect(sigChainService.getActiveChain()).toBe(sigChainTest2)
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    const prevSigChain = sigChainService.getChain(sigChainTest.teamId!)
    expect(prevSigChain).toBeDefined()
    expect(prevSigChain).not.toBe(sigChainTest2)
  })
  it('should delete nonactive chain without changing active chain', async () => {
    sigChainService.setActiveChain(sigChainTest2.teamId!)
    await sigChainService.deleteChain(sigChainTest.teamId!, false)
    expect(() => sigChainService.getChain(sigChainTest.teamId!)).toThrowError()
    expect(sigChainService.getActiveChain()).toBeDefined()
  })
  it('should delete active chain and set active chain to undefined', async () => {
    await sigChainService.deleteChain(sigChainTest2.teamId!, false)
    expect(sigChainService.getActiveChain).toThrowError()
  })
  it('should save and load sigchain using nestjs service', async () => {
    const TEAM_NAME = 'test3'
    sigChainTest3 = await sigChainService.createChain(true)
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    await sigChainService.saveChain(sigChainTest3.teamId!)
    await sigChainService.deleteChain(sigChainTest3.teamId!, false)
    const loadedSigChain = await sigChainService.loadChain(sigChainTest3.teamId!, true)
    expect(loadedSigChain).toBeDefined()
    expect(sigChainService.getActiveChain()).toBe(loadedSigChain)
  })
  it('should delete sigchains from disk', async () => {
    await sigChainService.deleteChain(sigChainTest3.teamId!, true)
    expect(() => sigChainService.getChain(sigChainTest3.teamId!)).toThrowError()
    await expect(sigChainService.loadChain(sigChainTest3.teamId!, true)).rejects.toThrowError()
  })
  // with random team names this is impossible in the cases we care about
  it.skip('should not allow duplicate chains to be added', async () => {
    await sigChainService.createChain(false)
    await expect(sigChainService.createChain(false)).rejects.toThrowError()
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
  })
  it('should handle concurrent chain operations correctly', async () => {
    const [chain1, chain2] = await Promise.all([
      sigChainService.createChain(true),
      sigChainService.createChain(false),
    ])
    expect(sigChainService.getChain(chain1.teamId!)).toBeDefined()
    expect(sigChainService.getChain(chain2.teamId!)).toBeDefined()
    expect(handleChainUpdateSpy).toBeCalledTimes(2)
  })
})

describe('SigChainService - listener lifecycle', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    await localDbService.open()
  })

  afterAll(async () => {
    await localDbService.close()
    await module.close()
  })

  it('does not accumulate listeners on chains when switching active chain', async () => {
    const chainA: SigChain = await sigChainService.createChain(true)
    // chainA is active: one listener attached
    expect(chainA.listenerCount(SigchainEvents.UPDATED)).toBe(1)

    const chainB: SigChain = await sigChainService.createChain(true)
    // Active switched A → B. detachSocketListeners(A) must have removed A's listener.
    expect(chainA.listenerCount(SigchainEvents.UPDATED)).toBe(0)
    expect(chainB.listenerCount(SigchainEvents.UPDATED)).toBe(1)

    sigChainService.setActiveChain(chainA.teamId!)
    // Active switched B → A. detachSocketListeners(B) must have removed B's listener,
    // and attachSocketListeners(A) adds exactly one to A.
    expect(chainA.listenerCount(SigchainEvents.UPDATED)).toBe(1)
    expect(chainB.listenerCount(SigchainEvents.UPDATED)).toBe(0)
  })

  it('does not emit iOS-native key or device events on non-ios platforms', async () => {
    const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')

    await sigChainService.createChain(true)

    expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(0)
    expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.DEVICE_CREDENTIALS_UPDATED)).toHaveLength(0)
  })

  it('emits new keys to iOS once and does not resend already-stored keys', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'ios' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)
      const teamId = chain.teamId!

      await waitForExpect(async () => {
        const keyCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)
        expect(keyCalls).toHaveLength(1)
        expect((keyCalls[0][1] as { keys: unknown[] }).keys.length).toBeGreaterThan(0)
        const storedKeys = await localDbService.getKeysStoredInKeychain(teamId)
        expect(storedKeys).toHaveLength((keyCalls[0][1] as { keys: unknown[] }).keys.length)
      })

      const storedKeysAfterFirstUpdate = await localDbService.getKeysStoredInKeychain(teamId)

      chain.emit('updated')

      await new Promise(resolve => setTimeout(resolve, 25))

      expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(1)
      expect(await localDbService.getKeysStoredInKeychain(teamId)).toEqual(storedKeysAfterFirstUpdate)
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })

  it('emits new keys to Android once and does not resend already-stored keys', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'android' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)
      const teamId = chain.teamId!

      await waitForExpect(async () => {
        const keyCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)
        expect(keyCalls).toHaveLength(1)
        expect((keyCalls[0][1] as { keys: unknown[] }).keys.length).toBeGreaterThan(0)
        const storedKeys = await localDbService.getKeysStoredInKeychain(teamId)
        expect(storedKeys).toHaveLength((keyCalls[0][1] as { keys: unknown[] }).keys.length)
      })

      const storedKeysAfterFirstUpdate = await localDbService.getKeysStoredInKeychain(teamId)

      chain.emit('updated')

      await new Promise(resolve => setTimeout(resolve, 25))

      expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(1)
      expect(await localDbService.getKeysStoredInKeychain(teamId)).toEqual(storedKeysAfterFirstUpdate)
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })

  it('emits device credentials for the NSE on ios', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'ios' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)

      await waitForExpect(() => {
        const deviceCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.DEVICE_CREDENTIALS_UPDATED)
        expect(deviceCalls).toHaveLength(1)
        expect(deviceCalls[0][1]).toEqual({
          deviceId: chain.device.deviceId,
          teamId: chain.teamId!,
          signingPrivateKey: chain.device.keys.signature.secretKey,
        })
      })
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })

  it('emits device credentials for the NSE on android', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'android' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)

      await waitForExpect(() => {
        const deviceCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.DEVICE_CREDENTIALS_UPDATED)
        expect(deviceCalls).toHaveLength(1)
        expect(deviceCalls[0][1]).toEqual({
          deviceId: chain.device.deviceId,
          teamId: chain.teamId!,
          signingPrivateKey: chain.device.keys.signature.secretKey,
        })
      })
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })
})
