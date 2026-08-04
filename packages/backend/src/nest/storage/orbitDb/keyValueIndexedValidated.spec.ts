import fs from 'fs'

import { Test, TestingModule } from '@nestjs/testing'
import { IPFSAccessController, type LogEntry } from '@orbitdb/core'

import { SigChainService } from '../../auth/sigchain.service'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { TestModule } from '../../common/test.module'
import { spawnLibp2pInstancesInMemory } from '../../common/test-utils'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { IpfsService } from '../../ipfs/ipfs.service'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { StorageModule } from '../storage.module'
import { OrbitDbService } from './orbitDb.service'
import { OrbitDbOp } from './orbitdb.types'
import { KeyValueIndexedValidated, KeyValueIndexedValidatedType } from './keyValueIndexedValidated'

describe('KeyValueIndexedValidated', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let storeSequence = 0

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule, SigChainModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
    await spawnLibp2pInstancesInMemory([module])

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    localDbService = await module.resolve(LocalDbService)
    const sigchainService = module.get<SigChainService>(SigChainService)
    await sigchainService.createChain(true)

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
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

  const openStore = async (validateFn?: (entry: LogEntry<string>) => Promise<boolean>) => {
    storeSequence += 1
    return orbitDbService.open<KeyValueIndexedValidatedType<string>>(`validated-index-${storeSequence}`, {
      type: 'KeyValueIndexedValidated',
      Database: KeyValueIndexedValidated(validateFn),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
  }

  it('allows a newer PUT to recreate a deleted key', async () => {
    const store = await openStore()

    await store.put('key', 'old')
    await store.del('key')
    await store.put('key', 'new')

    expect(await store.get('key')).toEqual('new')
  })

  it('keeps a key deleted when an older PUT becomes valid later', async () => {
    let validateOldPut = false
    const store = await openStore(async entry => entry.payload.op === OrbitDbOp.DEL || validateOldPut)

    await store.put('key', 'old')
    await store.del('key')
    validateOldPut = true
    await store.retryIndexingUnindexedEntries()

    expect(await store.get('key')).toBeUndefined()
  })

  it('preserves a newer PUT when an older DEL becomes valid later', async () => {
    let validateOldDelete = false
    const store = await openStore(async entry => entry.payload.op === OrbitDbOp.PUT || validateOldDelete)

    await store.del('key')
    await store.put('key', 'new')
    validateOldDelete = true
    await store.retryIndexingUnindexedEntries()

    expect(await store.get('key')).toEqual('new')
  })

  it('preserves the newest PUT when a full history is indexed in one traversal', async () => {
    let canValidate = false
    const store = await openStore(async () => canValidate)

    await store.put('key', 'old')
    await store.del('key')
    await store.put('key', 'new')
    canValidate = true
    await store.retryIndexingUnindexedEntries()

    expect(await store.get('key')).toEqual('new')
  })

  it('keeps the latest DEL as the winning operation', async () => {
    const store = await openStore()

    await store.put('key', 'value')
    await store.del('key')

    expect(await store.get('key')).toBeUndefined()
  })
})
