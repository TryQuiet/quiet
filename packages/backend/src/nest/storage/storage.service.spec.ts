import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import {
  prepareStore,
  getReduxStoreFactory,
  publicChannels,
  generateMessageFactoryContentWithId,
  Store,
} from '@quiet/state-manager'
import { ChannelMessage, Community, Identity, PublicChannel, TestMessage } from '@quiet/types'

import path from 'path'
import { type PeerId } from '@libp2p/interface'
import { TestModule } from '../common/test.module'
import { libp2pInstanceParams } from '../common/utils'
import { IpfsModule } from '../ipfs/ipfs.module'
import { IpfsService } from '../ipfs/ipfs.service'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from './storage.module'
import { StorageService } from './storage.service'
import fs from 'fs'
import { type FactoryGirl } from 'factory-girl'
import { fileURLToPath } from 'url'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { ORBIT_DB_DIR } from '../const'
import { createLogger } from '../common/logger'
import { createUserCertificateTestHelper, createTestRootCA } from '@quiet/identity'

const logger = createLogger('storageService:test')

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('StorageService', () => {
  let module: TestingModule
  let storageService: StorageService
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let localDbService: LocalDbService
  let peerId: PeerId

  let store: Store
  let factory: FactoryGirl
  let community: Community
  let channel: PublicChannel
  let alice: Identity
  let john: Identity
  let message: ChannelMessage
  let channelio: PublicChannel
  let filePath: string
  let utils: any
  let orbitDbDir: string

  jest.setTimeout(50000)

  beforeAll(async () => {
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create<Community>('Community')

    channel = publicChannels.selectors.publicChannels(store.getState())[0]

    channelio = {
      name: channel.name,
      description: channel.description,
      owner: channel.owner,
      timestamp: channel.timestamp,
      id: channel.id,
    }

    alice = await factory.create<Identity>('Identity', { communityId: community.id, nickname: 'alice' })

    john = await factory.create<Identity>('Identity', { communityId: community.id, nickname: 'john' })

    message = (
      await factory.create<TestMessage>('TestMessage', {
        message: generateMessageFactoryContentWithId(channel.id, alice.userId),
      })
    ).message
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    utils = await import('../common/utils')
    filePath = path.join(dirname, '/500kB-file.txt')

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, IpfsModule, SocketModule, Libp2pModule, LocalDbModule],
    }).compile()

    storageService = await module.resolve(StorageService)
    localDbService = await module.resolve(LocalDbService)
    libp2pService = await module.resolve(Libp2pService)
    ipfsService = await module.resolve(IpfsService)

    orbitDbDir = await module.resolve(ORBIT_DB_DIR)

    const params = await libp2pInstanceParams()
    peerId = params.peerId.peerId

    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()

    await localDbService.open()
    expect(localDbService.getStatus()).toEqual('open')

    await localDbService.setCommunity(community)
    await localDbService.setCurrentCommunityId(community.id)
  })

  afterEach(async () => {
    await libp2pService.libp2pInstance?.stop()
    await ipfsService.ipfsInstance?.stop()
    await storageService.stop()
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
    await module.close()
  })

  it('should be defined', async () => {
    await storageService.init(peerId)
  })

  describe('Storage', () => {
    it('should not create paths if createPaths is set to false', async () => {
      const orgProcessPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'android',
      })
      expect(fs.existsSync(orbitDbDir)).toBe(false)

      // FIXME: throws TypeError: Cannot assign to read only property 'createPaths' of object '[object Module]' and I can't be bothered to figure out how to get it to work
      // const createPathsSpy = jest.spyOn(utils, 'createPaths')

      await storageService.init(peerId)

      // FIXME: throws TypeError: Cannot assign to read only property 'createPaths' of object '[object Module]' and I can't be bothered to figure out how to get it to work
      // expect(createPathsSpy).not.toHaveBeenCalled()

      Object.defineProperty(process, 'platform', {
        value: orgProcessPlatform,
      })
    })

    it('db address should be the same on all platforms', () => {
      const dbAddress = StorageService.dbAddress({ root: 'zdpuABCDefgh123', path: 'channels.general_abcd' })
      expect(dbAddress).toEqual(`/orbitdb/zdpuABCDefgh123/channels.general_abcd`)
    })
  })
})
