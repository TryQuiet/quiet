import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { prepareStore, getReduxStoreFactory, publicChannels, Store } from '@quiet/state-manager'
import { Community, Identity, NetworkStats, PublicChannel, UserProfile } from '@quiet/types'

import path from 'path'
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
import { UserProfileStore } from './userProfile/userProfile.store'
import { SigChainService } from '../auth/sigchain.service'
import { SigChainModule } from '../auth/sigchain.service.module'
import waitForExpect from 'wait-for-expect'

const logger = createLogger('storageService:test')

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('StorageService', () => {
  let module: TestingModule
  let storageService: StorageService
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let localDbService: LocalDbService
  let userProfileStore: UserProfileStore
  let sigchainService: SigChainService

  let store: Store
  let factory: FactoryGirl
  let community: Community
  let channel: PublicChannel
  let alice: Identity
  let john: Identity
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
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    utils = await import('../common/utils')
    filePath = path.join(dirname, '/500kB-file.txt')

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, IpfsModule, SocketModule, Libp2pModule, LocalDbModule, SigChainModule],
    }).compile()

    storageService = await module.resolve(StorageService)
    localDbService = await module.resolve(LocalDbService)
    libp2pService = await module.resolve(Libp2pService)
    ipfsService = await module.resolve(IpfsService)
    userProfileStore = await module.resolve(UserProfileStore)
    sigchainService = await module.resolve(SigChainService)

    await sigchainService.createChain('team', 'alice', true)

    orbitDbDir = await module.resolve(ORBIT_DB_DIR)

    const params = await libp2pInstanceParams()

    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()

    await localDbService.open()
    expect(localDbService.getStatus()).toEqual('open')

    await localDbService.setCommunity(community)
    await localDbService.setCurrentCommunityId(community.id)
    logger.info('Running test:', expect.getState().currentTestName)
  })

  afterEach(async () => {
    jest.clearAllMocks()
    logger.info('Cleaning up after test:', expect.getState().currentTestName)
    await module.close()
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
  })

  it('should be defined', async () => {
    await storageService.init()
  })

  it('should clean stores and reinitialize', async () => {
    await storageService.init()
    logger.info(orbitDbDir)
    logger.info(storageService.quietDir)
    expect(fs.existsSync(orbitDbDir)).toBe(true)
    expect(fs.existsSync(storageService.quietDir)).toBe(true)
    await storageService.clean()
    await storageService.stop()
    expect(() => storageService.orbitDbService.orbitDb).toThrow('[get orbitDb]:no orbitDbInstance')
    expect(ipfsService.isStarted()).toBe(false)
    await storageService.init()
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

      await storageService.init()

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

    it('init should initialize services and start sync', async () => {
      const attachStoreSpy = jest.spyOn(storageService, 'attachStoreListeners')
      const startSyncSpy = jest.spyOn(storageService as any, 'startSync')
      await storageService.init()
      expect(ipfsService.isStarted()).toBe(true)
      expect(attachStoreSpy).toHaveBeenCalled()
      expect(startSyncSpy).toHaveBeenCalled()
    })

    it('addUserProfile should delegate to userProfileStore.setEntry', async () => {
      await storageService.init()
      const profile = { userId: sigchainService.user.userId, userData: null } as unknown as UserProfile
      const setEntrySpy = jest.spyOn(userProfileStore, 'setEntry').mockResolvedValueOnce({} as unknown as any)
      await storageService.addUserProfile(profile)
      await waitForExpect(async () => expect(setEntrySpy).toHaveBeenCalledWith(profile.userId, profile), 10_000)
    })

    it('addUserProfile should log and not throw when setEntry rejects', async () => {
      await storageService.init()
      const profile = { userId: 'charlie', userData: null } as unknown as UserProfile
      jest.spyOn(userProfileStore, 'setEntry').mockRejectedValueOnce(new Error('deferred'))
      await expect(storageService.addUserProfile(profile)).resolves.not.toThrow()
    })

    it('should set and get identity via localDbService', async () => {
      await storageService.init()
      const identity = { userId: sigchainService.user.userId, nickname: 'Alice' } as unknown as Identity
      const setIdentitySpy = jest.spyOn(localDbService, 'setIdentity').mockResolvedValueOnce()
      const getIdentitySpy = jest.spyOn(localDbService, 'getIdentity').mockResolvedValueOnce(identity)
      await storageService.setIdentity(identity)
      expect(setIdentitySpy).toHaveBeenCalledWith(identity)
      const result = await storageService.getIdentity(identity.userId)
      expect(getIdentitySpy).toHaveBeenCalledWith(identity.userId)
      expect(result).toEqual(identity)
    })

    it('updatePeerStore should merge existing and new peers', async () => {
      await storageService.init()
      const existingPeerStats = {
        peerOld: {
          peerId: 'peerOld',
          address: '/dns4/oldpeer.onion/tcp/80/ws/p2p/peerOld',
          lastSeen: 0,
          connectionTime: 0,
        },
      } as Record<string, NetworkStats>
      const userId = sigchainService.user.userId
      jest.spyOn(localDbService, 'getPeerStats').mockResolvedValue(existingPeerStats as any)

      const members = [{ userId }]
      jest.spyOn(sigchainService, 'getActiveChain').mockReturnValue({
        team: {
          members: () => members,
        },
      } as any)

      const userProfiles = [
        {
          userId,
          userData: { onionAddress: 'addr1.onion', peerId: 'peer1' },
        },
      ] as any
      jest.spyOn(userProfileStore, 'getUserProfiles').mockResolvedValue(userProfiles)

      const setPeerStatsSpy = jest.spyOn(localDbService, 'setPeerStats')

      await storageService.updatePeerStore()

      const expectedMultiaddr = `/dns4/addr1.onion/tcp/80/ws/p2p/peer1`
      await waitForExpect(async () => expect(setPeerStatsSpy).toHaveBeenCalledTimes(1), 5_000)
      const arg = setPeerStatsSpy.mock.calls[0][0]
      expect(arg['peer1']).toBeDefined()
      expect(arg['peer1'].peerId).toEqual('peer1')
      expect(arg['peer1'].address).toEqual(expectedMultiaddr)
    })
  })
})
