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
import { NotificationTokensStore } from './notifications/notificationTokens.store'
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
  let notificationTokensStore: NotificationTokensStore
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
      public: true,
      teamId: community.teamId!,
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
    notificationTokensStore = await module.resolve(NotificationTokensStore)
    sigchainService = await module.resolve(SigChainService)

    await sigchainService.createChain(true)

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

  it('should clean after stop and reinitialize metadata stores', async () => {
    await storageService.init()
    await storageService.stop()
    await storageService.clean()
    await storageService.init()

    expect(storageService.channelsService.channels).toBeDefined()
    expect(storageService.channelsService.privateChannels).toBeDefined()
    expect(userProfileStore.getStore()).toBeDefined()
    expect(notificationTokensStore.getStore()).toBeDefined()
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

    it('init should apply team metadata before starting sync', async () => {
      const teamId = 'team-id'
      const addTeamIdToDbMetasSpy = jest.spyOn(storageService, 'addTeamIdToDbMetas').mockImplementation(() => {})
      const startSyncSpy = jest.spyOn(storageService as any, 'startSync').mockResolvedValue(undefined)

      await storageService.init(teamId)

      expect(addTeamIdToDbMetasSpy).toHaveBeenCalledWith(teamId)
      expect(startSyncSpy).toHaveBeenCalledTimes(1)
      expect(addTeamIdToDbMetasSpy.mock.invocationCallOrder[0]).toBeLessThan(startSyncSpy.mock.invocationCallOrder[0])
    })

    it('init should wait for an in-flight initialization', async () => {
      const initDatabasesSpy = jest.spyOn(storageService, 'initDatabases')
      const startSyncSpy = jest.spyOn(storageService as any, 'startSync')

      await Promise.all([storageService.init(), storageService.init()])

      expect(ipfsService.isStarted()).toBe(true)
      expect(initDatabasesSpy).toHaveBeenCalledTimes(1)
      expect(startSyncSpy).toHaveBeenCalledTimes(1)
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

    it('purgeData continues when a data directory is locked', async () => {
      const lockedDir = path.join(storageService.quietDir, 'Ipfs-locked')
      fs.mkdirSync(lockedDir, { recursive: true })
      const rmSync = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
        if (target === lockedDir) {
          throw Object.assign(new Error('locked'), { code: 'EBUSY' })
        }
        return jest.requireActual<typeof fs>('fs').rmSync(target, options as any)
      })

      expect(() => storageService.purgeData()).not.toThrow()

      rmSync.mockRestore()
      fs.rmSync(lockedDir, { recursive: true, force: true })
    })

    it('purgeData removes arbitrary contents of uploads/downloads and every other dir under quietDir', () => {
      // Regression test for issue #3225: leaving a community must clean uploads/ and downloads/
      // along with every other data dir under quietDir. Whatever files exist there — any names,
      // any sizes, any nesting — must be purged.

      // Sorted, recursive, symlink-skipping snapshot of quietDir. Returns paths relative to root.
      const snapshotDir = (root: string): string[] => {
        if (!fs.existsSync(root)) return []
        const out: string[] = []
        const walk = (dir: string) => {
          let entries: fs.Dirent[]
          try {
            entries = fs.readdirSync(dir, { withFileTypes: true })
          } catch {
            return
          }
          for (const entry of entries) {
            if (entry.isSymbolicLink()) continue
            const abs = path.join(dir, entry.name)
            out.push(path.relative(root, abs))
            if (entry.isDirectory()) walk(abs)
          }
        }
        walk(root)
        return out.sort()
      }

      const quietDir = storageService.quietDir
      fs.mkdirSync(quietDir, { recursive: true })

      // Baseline: whatever the test harness has put under quietDir is the reference. We only
      // care about what we add beyond this.
      const baseline = snapshotDir(quietDir)

      // Seed a varied set of sentinel files. The goal is to show that *whatever* lands in
      // these dirs gets purged — not just one fixed name. We vary filename shapes, extensions,
      // sizes, and nesting depth.
      const sentinelsByDir: Record<string, string[]> = {
        // The two buggy dirs (issue #3225): seed aggressively.
        uploads: [
          'sentinel-upload.bin',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479.png', // uuid-like (mirrors real upload naming)
          'testimage.gif',
          'document.pdf',
          'file with spaces.txt',
          'émoji-名前.jpg', // unicode in filename
          '.hidden',
          'noextension',
          'subdir/nested.bin',
          'subdir/deeper/deep.bin',
          'empty.txt', // 0-byte file
        ],
        downloads: [
          'sentinel-download.bin',
          'cafe1234-5678-9abc-def0-123456789abc.gif',
          'received-image.png',
          'received with spaces.pdf',
          '中文文件.txt',
          'subdir/nested-download.bin',
          'subdir/a/b/c/very-nested.bin',
          'empty-download',
        ],
        // Regression anchors: already-purged dirs. If a future refactor accidentally
        // narrows the purge set, these tell us.
        Ipfs: ['sentinel-ipfs.bin', 'blocks/CIQ.../subblock.data'],
        OrbitDB: ['sentinel-orbit.bin'],
        libp2pDatastore: ['sentinel-libp2p.bin'],
        backendDB: ['sentinel-backend.bin'],
      }

      const expectedSeeded: string[] = []
      for (const [subdir, files] of Object.entries(sentinelsByDir)) {
        for (const rel of files) {
          const abs = path.join(quietDir, subdir, rel)
          fs.mkdirSync(path.dirname(abs), { recursive: true })
          // Vary content: empty files (~16% of set) test that 0-byte entries still get
          // walked and removed; everything else gets a tiny payload derived from the path.
          const content = rel.startsWith('empty') ? Buffer.alloc(0) : Buffer.from(`payload:${rel}`)
          fs.writeFileSync(abs, content)
          expectedSeeded.push(path.join(subdir, rel))
        }
      }

      // Sanity — if seeding failed, the test would pass trivially. Confirm every file exists.
      for (const rel of expectedSeeded) {
        expect(fs.existsSync(path.join(quietDir, rel))).toBe(true)
      }

      // Call purgeData (sync; see storage.service.ts:133)
      storageService.purgeData()

      // Layer 1 — targeted assertions for issue #3225.
      const uploadsPath = path.join(quietDir, 'uploads')
      const downloadsPath = path.join(quietDir, 'downloads')
      // uploads/ tree must be empty or absent after purgeData (issue #3225).
      expect(fs.existsSync(uploadsPath) ? snapshotDir(uploadsPath) : []).toEqual([])
      // downloads/ tree must be empty or absent after purgeData (issue #3225).
      expect(fs.existsSync(downloadsPath) ? snapshotDir(downloadsPath) : []).toEqual([])

      // Layer 2 — broad assertion. Anything we added beyond baseline must be gone.
      // This allowlist intentionally starts empty. If a future code change legitimately
      // needs a path to persist across "leave community", add it here with a justification.
      const persistAllowlist: string[] = []
      const after = snapshotDir(quietDir)
      const leftover = after.filter(p => !baseline.includes(p) && !persistAllowlist.includes(p))
      expect(leftover).toEqual([])

      // Defensive cleanup in case purgeData did not remove these (current bug).
      for (const subdir of Object.keys(sentinelsByDir)) {
        fs.rmSync(path.join(quietDir, subdir), { recursive: true, force: true })
      }
    })

    it('purgeData can preserve the Tor data directory', () => {
      const torDataDirectory = path.join(storageService.quietDir, 'TorDataDirectory')
      const ipfsDirectory = path.join(storageService.quietDir, 'Ipfs-test')
      fs.mkdirSync(torDataDirectory, { recursive: true })
      fs.mkdirSync(ipfsDirectory, { recursive: true })

      storageService.purgeData({ removeTorDataDirectory: false })

      expect(fs.existsSync(torDataDirectory)).toBe(true)
      expect(fs.existsSync(ipfsDirectory)).toBe(false)

      fs.rmSync(torDataDirectory, { recursive: true, force: true })
    })
  })
})
