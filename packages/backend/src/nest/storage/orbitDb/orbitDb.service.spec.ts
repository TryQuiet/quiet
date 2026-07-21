import { getCrypto } from 'pkijs'
import { jest } from '@jest/globals'
import fs from 'fs'

import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { createLogger } from '../../common/logger'
import { TestModule } from '../../common/test.module'
import { StorageModule } from '../storage.module'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { IpfsService } from '../../ipfs/ipfs.service'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { TestConfig } from '../../const'
import { spawnLibp2pInstancesInMemory } from '../../common/test-utils'
import { Libp2pNodeParams } from '../../libp2p/libp2p.types'
import { EventsType, IPFSAccessController, LogEntry } from '@orbitdb/core'
import { LogUpdate } from './orbitdb.types'
import { EventsWithStorage } from './eventsWithStorage'
import { KeyValueIndexedValidated, KeyValueIndexedValidatedType } from './keyValueIndexedValidated'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { SigChainService } from '../../auth/sigchain.service'

const logger = createLogger('messagesService:test')

describe('OrbitDbService', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let sigchainService: SigChainService
  let factory: FactoryGirl
  let libp2pParams: Libp2pNodeParams

  const teamName = 'test'

  beforeAll(async () => {
    factory = await getBaseTypesFactory()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule, SigChainModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
    libp2pParams = (await spawnLibp2pInstancesInMemory([module]))[0]

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    localDbService = await module.resolve(LocalDbService)

    sigchainService = module.get<SigChainService>(SigChainService)
    await sigchainService.createChain(true)
  })

  beforeEach(async () => {
    // log the test that is about to run
    logger.info('Running test:', expect.getState().currentTestName)
  })

  afterAll(async () => {
    await orbitDbService?.stop()
    if (fs.existsSync(orbitDbService.orbitDbDir)) {
      fs.rmSync(orbitDbService.orbitDbDir, { recursive: true })
    }
    await ipfsService?.stop()
    await libp2pService?.close()
    await localDbService?.close()
    await module?.close()
  })

  it('initializes the orbitDbService', async () => {
    orbitDbService = await module.resolve(OrbitDbService)
    expect(orbitDbService).toBeDefined()
    expect(orbitDbService.orbitDbDir.endsWith(TestConfig.ORBIT_DB_DIR)).toBeTruthy()
    expect(orbitDbService.identities).toBeUndefined()
  })

  it('throws an error when trying to access orbitDb without creating instance', () => {
    expect(() => orbitDbService.orbitDb).toThrowError('[get orbitDb]:no orbitDbInstance')
  })

  it('creates an orbitDb instance', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    expect(orbitDbService.orbitDb).toBeDefined()
    expect(orbitDbService.identities).toBeDefined()
  })

  it('stops the orbitDb instance cleanly after create', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    await expect(orbitDbService.stop()).resolves.toBeUndefined()
    expect(() => orbitDbService.orbitDb).toThrowError('[get orbitDb]:no orbitDbInstance')
    expect(orbitDbService.identities).toBeUndefined()
  })

  it('does not throw an error when accessing orbitDb after creating instance', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    expect(() => orbitDbService.orbitDb).not.toThrowError('[get orbitDb]:no orbitDbInstance')
  })

  it('stops the orbitDb instance', async () => {
    await orbitDbService.stop()
    expect(() => orbitDbService.orbitDb).toThrowError('[get orbitDb]:no orbitDbInstance')
    expect(orbitDbService.identities).toBeUndefined()
  })

  it('starts the orbitDb instance again after stopping', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    expect(orbitDbService.orbitDb).toBeDefined()
    expect(orbitDbService.identities).toBeDefined()
  })

  it('emits put event when an update to a store is made by the client user', async () => {
    const store = await orbitDbService.open<EventsType<{ content: string }>>('test-store', {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })

    const putListener = jest.fn((update: LogUpdate) => {
      expect(update).toBeDefined()
      expect(update.entry.payload.value).toStrictEqual({ content: 'test content' })
      expect(update.entry.identity).toEqual(orbitDbService.orbitDb.identity.hash)
    })
    OrbitDbService.events.on('put', putListener)

    try {
      await store.add({ content: 'test content' })
      expect(putListener).toHaveBeenCalled()
    } finally {
      OrbitDbService.events.off('put', putListener)
    }
  })

  it('emits put event when a local update matches the requested store alias', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    const requestedAddress = `alias-test-store-${Date.now()}`
    const store = await orbitDbService.open<EventsType<{ content: string; teamId: string }>>(requestedAddress, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
    const putListener = jest.fn()
    OrbitDbService.events.on('put', putListener)

    try {
      expect(() => {
        OrbitDbService.events.emit('update', {
          id: requestedAddress,
          hash: 'alias-store-entry',
          identity: orbitDbService.orbitDb.identity.hash,
          payload: {
            value: { content: 'test content', teamId: sigchainService.team.id },
          },
        } as unknown as LogEntry)
      }).not.toThrow()
      expect(putListener).toHaveBeenCalledWith(
        expect.objectContaining({
          addr: store.address,
          hash: 'alias-store-entry',
          teamId: sigchainService.team.id,
        })
      )
    } finally {
      OrbitDbService.events.off('put', putListener)
    }
  })

  it('emits put event for key-value metadata updates keyed by resolved store address', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    const requestedAddress = `metadata-alias-test-store-${Date.now()}`
    const teamId = sigchainService.team.id
    const store = await orbitDbService.open<KeyValueIndexedValidatedType<{ content: string; teamId: string }>>(
      requestedAddress,
      {
        Database: KeyValueIndexedValidated(),
        AccessController: IPFSAccessController({ write: ['*'] }),
        sync: false,
      }
    )
    OrbitDbService.updateMetadata(store, { teamId })
    const putListener = jest.fn()
    OrbitDbService.events.on('put', putListener)

    try {
      const hash = await store.put('channel-id', { content: 'metadata content', teamId })
      expect(putListener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: store.address,
          addr: store.address,
          hash,
          teamId,
        })
      )
    } finally {
      OrbitDbService.events.off('put', putListener)
    }
  })

  it('keeps unrelated stores registered when one shared-event store closes or drops', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    const closedStore = await orbitDbService.open<EventsType<{ content: string }>>(`closed-store-${Date.now()}`, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
    const droppedStore = await orbitDbService.open<EventsType<{ content: string }>>(`dropped-store-${Date.now()}`, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
    const activeStore = await orbitDbService.open<EventsType<{ content: string }>>(`active-store-${Date.now()}`, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
    const putListener = jest.fn()
    OrbitDbService.events.on('put', putListener)

    try {
      await closedStore.close()
      await droppedStore.drop()
      const hash = await activeStore.add({ content: 'still registered' })
      expect(putListener).toHaveBeenCalledWith(
        expect.objectContaining({
          addr: activeStore.address,
          hash,
        })
      )
    } finally {
      OrbitDbService.events.off('put', putListener)
    }
  })

  it('detaches and reattaches its static update listener across stop and create', async () => {
    await orbitDbService.create(ipfsService.ipfsInstance!)
    const updateListener = (orbitDbService as any).handleOrbitDbUpdate

    expect(OrbitDbService.events.listeners('update')).toContain(updateListener)

    await orbitDbService.stop()
    expect(OrbitDbService.events.listeners('update')).not.toContain(updateListener)

    await orbitDbService.create(ipfsService.ipfsInstance!)
    expect(OrbitDbService.events.listeners('update')).toContain(updateListener)
  })

  it('ingests concurrent heads even when their Lamport clock times differ', async () => {
    const firstHead = {
      id: 'concurrent-log',
      hash: 'zdpuAn4pdCWF7HEhYqaW45woXfTqWn4ccG24JBHbf3sDR1XHK',
      bytes: new Uint8Array([1]),
      next: [],
      clock: { time: 1 },
    } as unknown as LogEntry
    const ancestor = {
      id: 'concurrent-log',
      hash: 'zdpuAkTACgJnmr667GAafc5YQQYkYZHohonEhG2U9N9Q7WzmU',
      bytes: new Uint8Array([2]),
      next: [],
      clock: { time: 2 },
    } as unknown as LogEntry
    const secondHead = {
      id: 'concurrent-log',
      hash: 'zdpuB3HUfW7TszueRD7X5GsbRDp2Xk8hSfvyn5SoEhB1zNihi',
      bytes: new Uint8Array([3]),
      next: [ancestor.hash],
      clock: { time: 3 },
    } as unknown as LogEntry
    const joinHeadsSpy = jest.spyOn(orbitDbService as any, 'joinHeads').mockResolvedValue(undefined)

    await orbitDbService.ingestEntries([firstHead, ancestor, secondHead])

    expect(joinHeadsSpy).toHaveBeenCalledWith('concurrent-log', [firstHead, secondHead])
  })
})
