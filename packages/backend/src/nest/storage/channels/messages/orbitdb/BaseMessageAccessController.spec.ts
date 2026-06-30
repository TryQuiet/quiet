import { jest } from '@jest/globals'
import fs from 'fs'

import { Test, TestingModule } from '@nestjs/testing'
import { createLogger } from '../../../../common/logger'
import { TestModule } from '../../../../common/test.module'
import { StorageModule } from '../../../storage.module'
import { Libp2pModule } from '../../../../libp2p/libp2p.module'
import { IpfsModule } from '../../../../ipfs/ipfs.module'
import { Libp2pService } from '../../../../libp2p/libp2p.service'
import { IpfsService } from '../../../../ipfs/ipfs.service'
import { OrbitDbService } from '../../../orbitDb/orbitDb.service'
import { LocalDbService } from '../../../../local-db/local-db.service'
import { spawnLibp2pInstancesInMemory } from '../../../../common/test-utils'
import { Libp2pNodeParams } from '../../../../libp2p/libp2p.types'
import { SigChainModule } from '../../../../auth/sigchain.service.module'
import { SigChainService } from '../../../../auth/sigchain.service'
import { MessagesAccessController } from './MessagesAccessController'
import { type EventsType } from '@orbitdb/core'
import { EventsWithStorage } from '../../../orbitDb/eventsWithStorage'
import { EncryptedMessage } from '../messages.types'

const logger = createLogger('baseMessagesAccessController:test')

describe('BaseMessagesAccessController', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let sigchainService: SigChainService
  let libp2pParams: Libp2pNodeParams

  beforeAll(async () => {
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

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
  })

  beforeEach(() => {
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

  // Exercises the access-controller factory directly (not a full OrbitDB DB
  // reopen). On reopen, orbitdb.js:128 passes the persisted
  // `manifest.accessController` string straight to this factory in
  // `/<type>/<hash>` form, so calling the factory with `created.address` is a
  // faithful reproduction of that path. The factory must locate the stored
  // manifest block (put under the bare `<hash>`) and recover the same `write`
  // list. This currently fails because only `/ipfs/` is stripped, never the
  // controller's own `/<type>/` prefix, so storage.get misses the block.
  it('loads the ACL write list from a persisted access-controller address', async () => {
    const controller = new MessagesAccessController(sigchainService)
    const write = [orbitDbService.orbitDb.identity.id]
    const factory = controller.createAccessControllerFunc({ write, sigchainService })

    const orbitdb = orbitDbService.orbitDb
    const identities = orbitDbService.identities

    // First open: creates + persists the manifest, returns `/messagesaccess/<hash>`.
    const created = await (factory as any)({ orbitdb, identities })
    expect(created.address).toMatch(/^\/messagesaccess\//)
    expect(created.write).toEqual(write)

    // Reopen with the persisted address: must read the manifest back, not throw.
    const reopened = await (factory as any)({ orbitdb, identities, address: created.address })
    expect(reopened.write).toEqual(write)
    expect(reopened.address).toEqual(created.address)
  })

  it('reopens a real message database from its persisted OrbitDB address', async () => {
    const write = [orbitDbService.orbitDb.identity.id]
    const dbName = 'channels.message-access-controller-reopen'

    const created = await orbitDbService.open<EventsType<EncryptedMessage>>(dbName, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: new MessagesAccessController(sigchainService).createAccessControllerFunc({
        write,
        sigchainService,
      }),
      sync: false,
    })
    const dbAddress = created.address

    expect(dbAddress).toMatch(/^\/orbitdb\//)
    expect(created.access.address).toMatch(/^\/messagesaccess\//)
    expect(created.access.write).toEqual(write)

    // Clear OrbitDB's in-memory database cache. Reopening by full address below
    // must load the DB manifest and reconstruct the access controller from it.
    await created.close()

    const reopened = await orbitDbService.open<EventsType<EncryptedMessage>>(dbAddress, {
      Database: EventsWithStorage(),
      sync: false,
    })

    expect(reopened.address).toEqual(dbAddress)
    expect(reopened.access.address).toEqual(created.access.address)
    expect(reopened.access.write).toEqual(write)
  })

  it('reopens a real message database by name when the access controller is passed again', async () => {
    const write = ['*']
    const dbName = 'channels.message-access-controller-reopen-by-name-with-controller'
    const createAccessController = () =>
      new MessagesAccessController(sigchainService).createAccessControllerFunc({
        write,
        sigchainService,
      })

    const created = await orbitDbService.open<EventsType<EncryptedMessage>>(dbName, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: createAccessController(),
      sync: false,
    })
    const dbAddress = created.address
    const accessControllerAddress = created.access.address

    expect(dbAddress).toMatch(/^\/orbitdb\//)
    expect(accessControllerAddress).toMatch(/^\/messagesaccess\//)
    expect(created.access.write).toEqual(write)

    await created.close()

    const reopened = await orbitDbService.open<EventsType<EncryptedMessage>>(dbName, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: createAccessController(),
      sync: false,
    })

    expect(reopened.address).toEqual(dbAddress)
    expect(reopened.access.address).toEqual(accessControllerAddress)
    expect(reopened.access.write).toEqual(write)
  })
})
