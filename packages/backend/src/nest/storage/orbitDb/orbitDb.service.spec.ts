import { getCrypto } from 'pkijs'
import { jest } from '@jest/globals'
import fs from 'fs'

import { NoCryptoEngineError, UserProfile } from '@quiet/types'
import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
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
import { spawnLibp2pInstancesInMemory } from '../../common/test-utils'
import { Libp2pNodeParams } from '../../libp2p/libp2p.types'

const logger = createLogger('messagesService:test')

describe('OrbitDbService', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let factory: FactoryGirl
  let libp2pParams: Libp2pNodeParams

  beforeAll(async () => {
    factory = await getBaseTypesFactory()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
    libp2pParams = (await spawnLibp2pInstancesInMemory([module]))[0]

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    localDbService = await module.resolve(LocalDbService)
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

  it('does not throw an error when accessing orbitDb after creating instance', () => {
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
})
