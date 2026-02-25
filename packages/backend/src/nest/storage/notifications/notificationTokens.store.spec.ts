import { jest } from '@jest/globals'
import fs from 'fs'

import { PushNotificationTokens } from '@quiet/types'
import { MAX_TOKENS_PER_USER, NotificationTokensStore } from './notificationTokens.store'
import { Test, TestingModule } from '@nestjs/testing'
import { createLogger } from '../../common/logger'
import { SigChainService } from '../../auth/sigchain.service'
import { TestModule } from '../../common/test.module'
import { StorageModule } from '../storage.module'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { IpfsService } from '../../ipfs/ipfs.service'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { libp2pInstanceParams } from '../../common/utils'
import { TestConfig } from '../../const'
import { LogEntry } from '@orbitdb/core'
import { EncryptedAndSignedPayload } from '../../auth/services/crypto/types'

const logger = createLogger('notificationTokensStore:test')

describe('NotificationTokensStore', () => {
  let notificationTokensStore: NotificationTokensStore

  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let sigChainService: SigChainService
  let userId: string

  beforeEach(async () => {
    jest.clearAllMocks()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule, SigChainModule],
    }).compile()

    sigChainService = await module.resolve(SigChainService)
    await sigChainService.createChain('test-community', 'alice', true)
    userId = sigChainService.getActiveChain().user.userId

    libp2pService = await module.resolve(Libp2pService)
    const libp2pParams = await libp2pInstanceParams()
    await libp2pService.createInstance(libp2pParams)

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
    localDbService = await module.resolve(LocalDbService)

    notificationTokensStore = await module.resolve(NotificationTokensStore)
    await notificationTokensStore.init()
    logger.info('Running test:', expect.getState().currentTestName)
  })

  afterEach(async () => {
    await notificationTokensStore.close()
    await orbitDbService.stop()
    await ipfsService.stop()
    await libp2pService.close()
    await localDbService.close()
    if (fs.existsSync(TestConfig.ORBIT_DB_DIR)) {
      fs.rmSync(TestConfig.ORBIT_DB_DIR, { recursive: true })
    }
  })

  test('should be defined', () => {
    expect(notificationTokensStore).toBeDefined()
  })

  test('should set and get a notification token entry', async () => {
    const entry: PushNotificationTokens = { userId, tokens: ['ucan-1'] }
    const encrypted = await notificationTokensStore.setEntry(userId, entry)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toEqual(entry)

    const result = await notificationTokensStore.getEntry(userId)
    expect(result).toEqual(entry)
  })

  test('should get all entries', async () => {
    const entry: PushNotificationTokens = { userId, tokens: ['ucan-1', 'ucan-2'] }
    await notificationTokensStore.setEntry(userId, entry)

    const results = await notificationTokensStore.getAllEntries()
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(entry)
  })

  test('addToken creates new entry when none exists', async () => {
    await notificationTokensStore.addToken(userId, 'ucan-1')

    const result = await notificationTokensStore.getEntry(userId)
    expect(result).toEqual({ userId, tokens: ['ucan-1'] })
  })

  test('addToken appends to existing entry', async () => {
    await notificationTokensStore.addToken(userId, 'ucan-1')
    await notificationTokensStore.addToken(userId, 'ucan-2')

    const result = await notificationTokensStore.getEntry(userId)
    expect(result).toEqual({ userId, tokens: ['ucan-1', 'ucan-2'] })
  })

  test('addToken deduplicates by exact string match', async () => {
    await notificationTokensStore.addToken(userId, 'ucan-1')
    await notificationTokensStore.addToken(userId, 'ucan-1')

    const result = await notificationTokensStore.getEntry(userId)
    expect(result).toEqual({ userId, tokens: ['ucan-1'] })
  })

  test('addToken evicts oldest tokens when exceeding max ', async () => {
    for (let i = 0; i < MAX_TOKENS_PER_USER; i++) {
      await notificationTokensStore.addToken(userId, `ucan-${i}`)
    }
    await notificationTokensStore.addToken(userId, 'ucan-new')

    const result = await notificationTokensStore.getEntry(userId)
    expect(result.tokens).toHaveLength(MAX_TOKENS_PER_USER)
    expect(result.tokens[0]).toBe('ucan-new') // ucan-0 evicted
  })
})

describe('NotificationTokensStore/validateEntry', () => {
  test('should reject entry if key does not match userId in payload or signature', async () => {
    const aliceUserId = 'aliceUserId'
    const bobUserId = 'bobUserId'
    const encPayload: any = {
      userId: aliceUserId,
      signature: { author: { name: aliceUserId } },
      encrypted: 'fake-encrypted',
    }
    const decEntry: PushNotificationTokens = { userId: aliceUserId, tokens: ['ucan-1'] }
    const store = new NotificationTokensStore({} as any, { crypto: {}, user: { userId: aliceUserId } } as any)
    jest.spyOn(store, 'decryptEntry').mockResolvedValue(decEntry)
    const entry = {
      hash: 'fakehash',
      payload: { key: bobUserId, op: 'PUT', value: encPayload },
    } as unknown as LogEntry<EncryptedAndSignedPayload>

    const result = await store.validateEntry(entry)
    expect(result).toBe(false)
  })

  test('should reject entry if tokens is not a string array', async () => {
    const aliceUserId = 'aliceUserId'
    const encPayload: any = {
      userId: aliceUserId,
      signature: { author: { name: aliceUserId } },
      encrypted: 'fake-encrypted',
    }
    const decEntry: any = { userId: aliceUserId, tokens: 'not-an-array' }
    const store = new NotificationTokensStore({} as any, { crypto: {}, user: { userId: aliceUserId } } as any)
    jest.spyOn(store, 'decryptEntry').mockResolvedValue(decEntry)
    const entry = {
      hash: 'fakehash',
      payload: { key: aliceUserId, op: 'PUT', value: encPayload },
    } as unknown as LogEntry<EncryptedAndSignedPayload>

    const result = await store.validateEntry(entry)
    expect(result).toBe(false)
  })

  test('should reject entry if tokens exceeds max per user', async () => {
    const aliceUserId = 'aliceUserId'
    const encPayload: any = {
      userId: aliceUserId,
      signature: { author: { name: aliceUserId } },
      encrypted: 'fake-encrypted',
    }
    const decEntry: PushNotificationTokens = {
      userId: aliceUserId,
      tokens: Array.from({ length: 11 }, (_, i) => `ucan-${i}`),
    }
    const store = new NotificationTokensStore({} as any, { crypto: {}, user: { userId: aliceUserId } } as any)
    jest.spyOn(store, 'decryptEntry').mockResolvedValue(decEntry)
    const entry = {
      hash: 'fakehash',
      payload: { key: aliceUserId, op: 'PUT', value: encPayload },
    } as unknown as LogEntry<EncryptedAndSignedPayload>

    const result = await store.validateEntry(entry)
    expect(result).toBe(false)
  })

  test('should reject entry if decryption fails', async () => {
    const aliceUserId = 'aliceUserId'
    const encPayload: any = {
      userId: aliceUserId,
      signature: { author: { name: aliceUserId } },
      encrypted: 'fake-encrypted',
    }
    const store = new NotificationTokensStore({} as any, { crypto: {}, user: { userId: aliceUserId } } as any)
    jest.spyOn(store, 'decryptEntry').mockRejectedValue(new Error('decryption failed'))
    const entry = {
      hash: 'fakehash',
      payload: { key: aliceUserId, op: 'PUT', value: encPayload },
    } as unknown as LogEntry<EncryptedAndSignedPayload>

    const result = await store.validateEntry(entry)
    expect(result).toBe(false)
  })
})
