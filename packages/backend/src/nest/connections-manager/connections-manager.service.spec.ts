import { expect, jest } from '@jest/globals'

import fs from 'fs'
import path from 'path'
import { Test, TestingModule } from '@nestjs/testing'
import { getReduxStoreFactory, prepareStore, type Store } from '@quiet/state-manager'
import {
  CommunityOwnership,
  SocketActions,
  SocketEvents,
  type Community,
  type Identity,
  type PublicChannel,
} from '@quiet/types'
import { type FactoryGirl } from 'factory-girl'
import { TestModule } from '../common/test.module'
import { libp2pInstanceParams, removeFilesFromDir } from '../common/utils'
import { QUIET_DIR, SERVER_IO_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { SocketModule } from '../socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { createLibp2pAddress, validInvitationDatav4 } from '@quiet/common'

import { createLogger } from '../common/logger'
import { SigChainService } from '../auth/sigchain.service'
import { StorageModule } from '../storage/storage.module'
import { QSSService } from '../qss/qss.service'
import { QSSSyncManager } from '../qss/qss-sync-manager.service'
import { Libp2pEvents } from '../libp2p/libp2p.types'
import { QSSOperationResult, QSSEvents } from '../qss/qss.types'
import { QPSService } from '../qps/qps.service'
import waitForExpect from 'wait-for-expect'
import { CaptchaService } from '../captcha/captcha.service'
import type { SigChain } from '../auth/sigchain'
import type { ServerIoProviderTypes } from '../types'
import { RoleName } from '../auth/services/roles/roles'
import { ChannelsService } from '../storage/channels/channels.service'
import { StorageService } from '../storage/storage.service'
import { Libp2pService } from '../libp2p/libp2p.service'
import { randomKey } from '@localfirst/crypto'

const logger = createLogger('connections-manager.service.spec')

describe('ConnectionsManagerService', () => {
  let module: TestingModule
  let connectionsManagerService: ConnectionsManagerService
  let localDbService: LocalDbService
  let quietDir: string
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let userIdentity: Identity
  let communityRootCa: string
  let sigChainService: SigChainService
  let handleChainUpdateSpy: jest.SpiedFunction<any>
  let qssService: QSSService
  let qssSyncManager: QSSSyncManager
  let qpsService: QPSService
  let captchaService: CaptchaService
  let chain: SigChain
  let serverIoProvider: ServerIoProviderTypes
  let channelsService: ChannelsService
  let storageService: StorageService
  let libp2pService: Libp2pService
  const originalPlatform = process.platform as string

  beforeEach(async () => {
    jest.clearAllMocks()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    communityRootCa = 'rootCa'

    module = await Test.createTestingModule({
      imports: [TestModule, LocalDbModule, StorageModule, ConnectionsManagerModule, SocketModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: '', torHashedPassword: '' })
      .compile()

    connectionsManagerService = await module.resolve(ConnectionsManagerService)
    localDbService = await module.resolve(LocalDbService)
    sigChainService = await module.resolve(SigChainService)
    qssService = await module.resolve(QSSService)
    qssSyncManager = await module.resolve(QSSSyncManager)
    qpsService = await module.resolve(QPSService)
    captchaService = await module.resolve(CaptchaService)
    serverIoProvider = await module.resolve(SERVER_IO_PROVIDER)
    channelsService = await module.resolve(ChannelsService)
    storageService = await module.resolve(StorageService)
    libp2pService = await module.resolve(Libp2pService)

    jest.spyOn(qssSyncManager, 'processDLQDecrypt').mockResolvedValue(undefined)
    await localDbService.open()

    handleChainUpdateSpy = jest.spyOn(sigChainService as any, 'handleChainUpdate').mockImplementation(() => {
      logger.debug('MOCK: handling chain update')
    })

    // initialize sigchain on local db
    chain = await sigChainService.createChain(false)
    community = await factory.create('Community', {
      rootCa: communityRootCa,
      name: 'communityName',
      teamId: chain.teamId!,
    })
    userIdentity = await factory.create('Identity', {
      communityId: community.id,
    })
    await sigChainService.saveChain(chain.teamId!)
    await sigChainService.deleteChain(chain.teamId!, false)
    quietDir = await module.resolve(QUIET_DIR)
  })

  afterEach(async () => {
    if (connectionsManagerService) {
      await connectionsManagerService.closeAllServices()
    }
    handleChainUpdateSpy.mockReset()
    removeFilesFromDir(quietDir)
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(connectionsManagerService).toBeDefined()
  })

  it('launches community on init if its data exists in local db', async () => {
    logger.info('launches community on init if its data exists in local db')
    const remotePeer = createLibp2pAddress(
      'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
      '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx'
    )

    // Using the factory includes extra properties that affect the assertion
    // below
    const actualCommunity = {
      id: community.id,
      name: community.name,
      peerList: [remotePeer],
      ownership: CommunityOwnership.Owner,
      teamId: community.teamId,
    }
    await localDbService.setCommunity(actualCommunity)
    await localDbService.setCurrentCommunityId(community.id)

    await localDbService.setIdentity(userIdentity)

    logger.info('Closing all services')
    await connectionsManagerService.closeAllServices()

    const launchCommunitySpy = jest.spyOn(connectionsManagerService, 'launchCommunity').mockResolvedValue()

    await connectionsManagerService.init()

    expect(launchCommunitySpy).toHaveBeenCalledTimes(1)
  })

  it('does not launch community on init if its data does not exist in local db', async () => {
    logger.info('does not launch community on init if its data does not exist in local db')
    await connectionsManagerService.closeAllServices()
    await connectionsManagerService.init()
    const launchCommunitySpy = jest.spyOn(connectionsManagerService, 'launchCommunity')
    expect(launchCommunitySpy).not.toHaveBeenCalled()
  })

  it('community is only launched once', async () => {
    await localDbService.setCommunity(community)
    await localDbService.setCurrentCommunityId(community.id)

    //@ts-ignore
    const launchSpy = jest.spyOn(connectionsManagerService, 'launch').mockResolvedValue('address')

    await Promise.all([
      connectionsManagerService.launchCommunity(community.id),
      connectionsManagerService.launchCommunity(community.id),
    ])

    expect(launchSpy).toBeCalledTimes(1)
  })

  it('waits for current community id to be persisted before launching community services', async () => {
    await localDbService.setCommunity(community)

    let resolveSetCurrentCommunityId!: () => void
    const setCurrentCommunityIdPromise = new Promise<void>(resolve => {
      resolveSetCurrentCommunityId = resolve
    })
    const setCurrentCommunityIdSpy = jest
      .spyOn(localDbService, 'setCurrentCommunityId')
      .mockReturnValue(setCurrentCommunityIdPromise)
    const loadChainSpy = jest.spyOn(sigChainService, 'loadChain').mockResolvedValue({} as any)
    const launchSpy = jest.spyOn(connectionsManagerService, 'launch').mockResolvedValue()

    const launchCommunityPromise = connectionsManagerService.launchCommunity(community.id)

    await waitForExpect(() => expect(setCurrentCommunityIdSpy).toHaveBeenCalledWith(community.id))
    expect(loadChainSpy).not.toHaveBeenCalled()
    expect(launchSpy).not.toHaveBeenCalled()

    resolveSetCurrentCommunityId()
    await launchCommunityPromise

    expect(loadChainSpy).toHaveBeenCalledWith(community.teamId, true)
    expect(launchSpy).toHaveBeenCalledWith(community)
  })

  it('pauses and resumes qss alongside the mobile lifecycle', async () => {
    const closeSocketSpy = jest.spyOn(connectionsManagerService, 'closeSocket').mockResolvedValue()
    const listenSpy = jest.spyOn(connectionsManagerService['socketService'], 'listen').mockResolvedValue()
    const libp2pPauseSpy = jest.spyOn(connectionsManagerService.libp2pService, 'pause').mockResolvedValue(true)
    const libp2pResumeSpy = jest.spyOn(connectionsManagerService.libp2pService, 'resume').mockResolvedValue(true)
    const qssPauseSpy = jest.spyOn(qssService, 'pause').mockImplementation(() => {})
    const qssResumeSpy = jest.spyOn(qssService, 'resume').mockResolvedValue()

    await connectionsManagerService.pause()
    expect(qssPauseSpy).toHaveBeenCalledTimes(1)
    expect(closeSocketSpy).toHaveBeenCalledTimes(1)
    expect(libp2pPauseSpy).toHaveBeenCalledTimes(1)

    await connectionsManagerService.resume()
    expect(listenSpy).toHaveBeenCalledTimes(1)
    expect(libp2pResumeSpy).toHaveBeenCalledTimes(1)
    expect(qssResumeSpy).toHaveBeenCalledTimes(1)
  })

  it('uses bounded socket readiness and awaits libp2p before resuming qss', async () => {
    let resolveLibp2pResume!: (value: boolean) => void
    const libp2pResumePromise = new Promise<boolean>(resolve => {
      resolveLibp2pResume = resolve
    })
    const socketInitSpy = jest.spyOn(connectionsManagerService['socketService'], 'init').mockResolvedValue()
    const listenSpy = jest.spyOn(connectionsManagerService['socketService'], 'listen').mockResolvedValue()
    const libp2pResumeSpy = jest
      .spyOn(connectionsManagerService.libp2pService, 'resume')
      .mockReturnValue(libp2pResumePromise)
    const qssResumeSpy = jest.spyOn(qssService, 'resume').mockResolvedValue()

    const resumePromise = connectionsManagerService.resume()
    await waitForExpect(() => expect(libp2pResumeSpy).toHaveBeenCalledTimes(1))

    expect(socketInitSpy).not.toHaveBeenCalled()
    expect(listenSpy).toHaveBeenCalledTimes(1)
    expect(qssResumeSpy).not.toHaveBeenCalled()

    resolveLibp2pResume(true)
    await resumePromise

    expect(qssResumeSpy).toHaveBeenCalledTimes(1)
    expect(listenSpy.mock.invocationCallOrder[0]).toBeLessThan(libp2pResumeSpy.mock.invocationCallOrder[0])
    expect(libp2pResumeSpy.mock.invocationCallOrder[0]).toBeLessThan(qssResumeSpy.mock.invocationCallOrder[0])
  })

  it('sets storage team metadata once when QSS and libp2p join events race', async () => {
    const teamId = 'team-id'
    let resolveStorageInit: () => void
    const storageInitPromise = new Promise<void>(resolve => {
      resolveStorageInit = resolve
    })

    jest.spyOn(connectionsManagerService['storageService'], 'getIdentity').mockResolvedValue(userIdentity)
    jest.spyOn(connectionsManagerService, 'spawnTorHiddenService').mockResolvedValue('localhost.onion')
    jest.spyOn(connectionsManagerService.libp2pService, 'createInstance').mockResolvedValue(undefined as any)
    jest.spyOn(qssService, 'connect').mockResolvedValue(QSSOperationResult.SUCCESS)
    jest.spyOn(connectionsManagerService['tor'], 'isBootstrappingFinished').mockResolvedValue(false)
    connectionsManagerService['ports'] = {
      socksPort: 9001,
      libp2pHiddenService: 9002,
      controlPort: 9003,
      dataServer: 9004,
      httpTunnelPort: 9005,
    }
    jest.spyOn(sigChainService, 'getActiveChain').mockReturnValue({
      team: {
        id: teamId,
      },
      roles: {
        amIMemberOfRole: () => false,
      },
    } as any)

    const storageInitSpy = jest
      .spyOn(connectionsManagerService['storageService'], 'init')
      .mockReturnValue(storageInitPromise)
    const markTeamStorageReadySpy = jest.spyOn(qssService, 'markTeamStorageReady').mockImplementation(() => {})

    let launchResolved = false
    const launchPromise = connectionsManagerService.launch(community).then(() => {
      launchResolved = true
    })

    await waitForExpect(() => expect(qssService.listenerCount(QSSEvents.QSS_FULLY_JOINED)).toBe(1))

    qssService.emit(QSSEvents.QSS_FULLY_JOINED, teamId)
    connectionsManagerService.libp2pService.emit(Libp2pEvents.AUTH_JOINED, { peer: 'peer-id' })

    await waitForExpect(() => expect(storageInitSpy).toHaveBeenCalledWith(teamId))
    expect(markTeamStorageReadySpy).not.toHaveBeenCalled()
    expect(launchResolved).toBe(false)

    resolveStorageInit!()

    await waitForExpect(() => expect(markTeamStorageReadySpy).toHaveBeenCalledTimes(1))
    await launchPromise
    expect(storageInitSpy).toHaveBeenCalledTimes(1)
    expect(markTeamStorageReadySpy).toHaveBeenCalledTimes(1)
    expect(markTeamStorageReadySpy).toHaveBeenCalledWith(teamId)
    expect(launchResolved).toBe(true)
  })

  it('handles QSS_FULLY_JOINED emitted synchronously while connecting', async () => {
    const teamId = 'team-id'

    jest.spyOn(connectionsManagerService['storageService'], 'getIdentity').mockResolvedValue(userIdentity)
    jest.spyOn(connectionsManagerService, 'spawnTorHiddenService').mockResolvedValue('localhost.onion')
    jest.spyOn(connectionsManagerService.libp2pService, 'createInstance').mockResolvedValue(undefined as any)
    jest.spyOn(qssService, 'connect').mockImplementation(() => {
      qssService.emit(QSSEvents.QSS_FULLY_JOINED, teamId)
      return Promise.resolve(QSSOperationResult.SUCCESS)
    })
    jest.spyOn(connectionsManagerService['tor'], 'isBootstrappingFinished').mockResolvedValue(false)
    connectionsManagerService['ports'] = {
      socksPort: 9001,
      libp2pHiddenService: 9002,
      controlPort: 9003,
      dataServer: 9004,
      httpTunnelPort: 9005,
    }
    jest.spyOn(sigChainService, 'getActiveChain').mockReturnValue({
      team: {
        id: teamId,
      },
      roles: {
        amIMemberOfRole: () => false,
      },
    } as any)

    const storageInitSpy = jest.spyOn(connectionsManagerService['storageService'], 'init').mockResolvedValue()
    const markTeamStorageReadySpy = jest.spyOn(qssService, 'markTeamStorageReady').mockImplementation(() => {})

    await connectionsManagerService.launch(community)

    expect(qssService.connect).toHaveBeenCalledTimes(1)
    expect(storageInitSpy).toHaveBeenCalledTimes(1)
    expect(storageInitSpy).toHaveBeenCalledWith(teamId)
    expect(markTeamStorageReadySpy).toHaveBeenCalledTimes(1)
    expect(markTeamStorageReadySpy).toHaveBeenCalledWith(teamId)
  })

  it('attempts notification token tombstoning before closing services and still leaves if it is not acked', async () => {
    const tombstoneSpy = jest.spyOn(qpsService, 'tombstoneCurrentUserNotificationTokens').mockResolvedValue(false)
    const captchaResetSpy = jest.spyOn(captchaService, 'reset')
    captchaService.hcaptchaToken = 'used-token'
    const closeAllServicesSpy = jest.spyOn(connectionsManagerService, 'closeAllServices').mockResolvedValue()
    const storageCleanSpy = jest.spyOn(connectionsManagerService['storageService'], 'clean').mockResolvedValue()
    const cleanDatastoreSpy = jest.spyOn(connectionsManagerService.libp2pService, 'cleanDatastore').mockResolvedValue()
    const closeDatastoreSpy = jest.spyOn(connectionsManagerService.libp2pService, 'closeDatastore').mockResolvedValue()
    const purgeDataSpy = jest
      .spyOn(connectionsManagerService['storageService'], 'purgeData')
      .mockImplementation(() => {})
    const resetHiddenServicesSpy = jest
      .spyOn(connectionsManagerService['tor'], 'resetHiddenServices')
      .mockImplementation(() => {})
    const resetStateSpy = jest.spyOn(connectionsManagerService, 'resetState').mockResolvedValue()
    const localDbOpenSpy = jest.spyOn(connectionsManagerService['localDbService'], 'open').mockResolvedValue()
    const openSocketSpy = jest.spyOn(connectionsManagerService, 'openSocket').mockResolvedValue()
    const qssResumeSpy = jest.spyOn(qssService, 'resume').mockResolvedValue()

    await connectionsManagerService.leaveCommunity()

    expect(tombstoneSpy).toHaveBeenCalledTimes(1)
    expect(captchaResetSpy).toHaveBeenCalledTimes(1)
    expect(captchaService.hcaptchaToken).toBeNull()
    expect(closeAllServicesSpy).toHaveBeenCalledTimes(1)
    expect(qssResumeSpy).toHaveBeenCalledTimes(1)
    expect(openSocketSpy.mock.invocationCallOrder[0]).toBeLessThan(qssResumeSpy.mock.invocationCallOrder[0])
    expect(tombstoneSpy.mock.invocationCallOrder[0]).toBeLessThan(closeAllServicesSpy.mock.invocationCallOrder[0])
    expect(captchaResetSpy.mock.invocationCallOrder[0]).toBeLessThan(closeAllServicesSpy.mock.invocationCallOrder[0])

    captchaResetSpy.mockRestore()
    storageCleanSpy.mockRestore()
    cleanDatastoreSpy.mockRestore()
    closeDatastoreSpy.mockRestore()
    purgeDataSpy.mockRestore()
    resetHiddenServicesSpy.mockRestore()
    resetStateSpy.mockRestore()
    localDbOpenSpy.mockRestore()
    openSocketSpy.mockRestore()
    qssResumeSpy.mockRestore()
  })

  it('erases previous community artifacts before creating a community', async () => {
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)
    const createChainSpy = jest.spyOn(sigChainService, 'createChain').mockResolvedValue({
      team: {
        id: 'team-id',
      },
    } as any)
    jest.spyOn(sigChainService, 'user', 'get').mockReturnValue({ userId: userIdentity.userId } as any)
    jest.spyOn(connectionsManagerService, 'getNetworkInfo').mockResolvedValue(userIdentity.networkInfo)
    jest.spyOn(connectionsManagerService['storageService'], 'setIdentity').mockResolvedValue()
    jest.spyOn(connectionsManagerService, 'launchCommunity').mockResolvedValue()
    jest.spyOn(connectionsManagerService['storageService'], 'addUserProfile').mockResolvedValue({ success: true })

    await connectionsManagerService.createCommunity({
      id: community.id,
      name: community.name!,
      username: 'john',
      useServer: false,
      tosAccepted: true,
    })

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(createChainSpy).toHaveBeenCalledTimes(1)
    expect(eraseArtifactsSpy.mock.invocationCallOrder[0]).toBeLessThan(createChainSpy.mock.invocationCallOrder[0])
  })

  it('erases previous community artifacts before joining a community', async () => {
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)
    const getNetworkInfoSpy = jest
      .spyOn(connectionsManagerService, 'getNetworkInfo')
      .mockResolvedValue(userIdentity.networkInfo)
    jest.spyOn(sigChainService, 'user', 'get').mockReturnValue({ userId: userIdentity.userId } as any)
    jest.spyOn(connectionsManagerService['storageService'], 'setIdentity').mockResolvedValue()
    jest.spyOn(connectionsManagerService['storageService'], 'addUserProfile').mockResolvedValue({ success: true })

    await connectionsManagerService.joinCommunity({
      id: community.id,
      name: community.name!,
      username: 'john',
      inviteData: validInvitationDatav4[0],
    })

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(getNetworkInfoSpy).toHaveBeenCalledTimes(1)
    expect(eraseArtifactsSpy.mock.invocationCallOrder[0]).toBeLessThan(getNetworkInfoSpy.mock.invocationCallOrder[0])
  })

  it('pre-community artifact erasure cleans local db, libp2p, storage, tor, and state without closing the socket', async () => {
    const storageCleanSpy = jest.spyOn(connectionsManagerService['storageService'], 'clean').mockResolvedValue()
    const libp2pCloseSpy = jest.spyOn(connectionsManagerService.libp2pService, 'close').mockResolvedValue()
    const cleanDatastoreSpy = jest.spyOn(connectionsManagerService.libp2pService, 'cleanDatastore').mockResolvedValue()
    const closeDatastoreSpy = jest.spyOn(connectionsManagerService.libp2pService, 'closeDatastore').mockResolvedValue()
    const deleteChainSpy = jest.spyOn(sigChainService, 'deleteChain').mockResolvedValue()
    const purgeLocalDbArtifactsSpy = jest.spyOn(localDbService, 'purgeArtifacts').mockResolvedValue()
    const purgeDataSpy = jest
      .spyOn(connectionsManagerService['storageService'], 'purgeData')
      .mockImplementation(() => {})
    const resetHiddenServicesSpy = jest
      .spyOn(connectionsManagerService['tor'], 'resetHiddenServices')
      .mockImplementation(() => {})
    const resetStateSpy = jest.spyOn(connectionsManagerService, 'resetState').mockResolvedValue()
    const localDbOpenSpy = jest.spyOn(localDbService, 'open').mockResolvedValue()
    const closeSocketSpy = jest.spyOn(connectionsManagerService, 'closeSocket').mockResolvedValue()
    sigChainService.activeChainTeamId = community.teamId

    await (connectionsManagerService as any).erasePreviousCommunityArtifacts()

    expect(storageCleanSpy).toHaveBeenCalledTimes(1)
    expect(libp2pCloseSpy).toHaveBeenCalledWith(false)
    expect(cleanDatastoreSpy).toHaveBeenCalledTimes(1)
    expect(closeDatastoreSpy).toHaveBeenCalledTimes(1)
    expect(deleteChainSpy).toHaveBeenCalled()
    expect(purgeLocalDbArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(purgeDataSpy).toHaveBeenCalledTimes(1)
    expect(purgeDataSpy).toHaveBeenCalledWith({ removeTorDataDirectory: false })
    expect(resetHiddenServicesSpy).toHaveBeenCalledTimes(1)
    expect(resetStateSpy).toHaveBeenCalledTimes(1)
    expect(localDbOpenSpy).toHaveBeenCalledTimes(1)
    expect(closeSocketSpy).not.toHaveBeenCalled()
  })

  describe('startup purge marker (#3225 crash-safe defense in depth)', () => {
    const markerPath = () => path.join(quietDir, '.leave-in-progress')

    beforeEach(() => {
      // Make sure no stale marker leaks across tests in the same module's quietDir.
      if (fs.existsSync(markerPath())) {
        fs.rmSync(markerPath(), { force: true })
      }
    })

    afterEach(() => {
      if (fs.existsSync(markerPath())) {
        fs.rmSync(markerPath(), { force: true })
      }
    })

    it('purges orphaned artifacts at startup when no community is in storage AND marker is present', async () => {
      jest.spyOn(localDbService, 'getCurrentCommunity').mockResolvedValue(undefined)
      fs.mkdirSync(quietDir, { recursive: true })
      fs.writeFileSync(markerPath(), new Date().toISOString())
      const purgeArtifactsSpy = jest.spyOn(localDbService, 'purgeArtifacts').mockResolvedValue()
      const purgeDataSpy = jest
        .spyOn(connectionsManagerService['storageService'], 'purgeData')
        .mockImplementation(() => {})

      await connectionsManagerService.launchCommunityFromStorage()

      expect(purgeArtifactsSpy).toHaveBeenCalledTimes(1)
      expect(purgeDataSpy).toHaveBeenCalledTimes(1)
      expect(fs.existsSync(markerPath())).toBe(false)
    })

    it('does NOT purge at startup when no community is in storage AND no marker is present', async () => {
      // The back-compat / pending-migration / fresh-install case. We must not nuke
      // data that hasn't been registered with LocalDB yet.
      jest.spyOn(localDbService, 'getCurrentCommunity').mockResolvedValue(undefined)
      expect(fs.existsSync(markerPath())).toBe(false)
      const purgeArtifactsSpy = jest.spyOn(localDbService, 'purgeArtifacts').mockResolvedValue()
      const purgeDataSpy = jest
        .spyOn(connectionsManagerService['storageService'], 'purgeData')
        .mockImplementation(() => {})

      await connectionsManagerService.launchCommunityFromStorage()

      expect(purgeArtifactsSpy).not.toHaveBeenCalled()
      expect(purgeDataSpy).not.toHaveBeenCalled()
    })

    it('purges at startup when the marker is present even if a community is also found', async () => {
      // The marker means the user intended to leave. Whether CURRENT_COMMUNITY_ID happens
      // to still be set depends on exactly when the crash interrupted the leave (resetState
      // clears it near the end). The marker is the authoritative signal — finish the purge
      // regardless of what LocalDB currently reports.
      fs.mkdirSync(quietDir, { recursive: true })
      fs.writeFileSync(markerPath(), new Date().toISOString())
      const getCurrentCommunitySpy = jest.spyOn(localDbService, 'getCurrentCommunity').mockResolvedValue(community)
      const launchCommunitySpy = jest.spyOn(connectionsManagerService, 'launchCommunity').mockResolvedValue()
      const purgeArtifactsSpy = jest.spyOn(localDbService, 'purgeArtifacts').mockResolvedValue()
      const purgeDataSpy = jest
        .spyOn(connectionsManagerService['storageService'], 'purgeData')
        .mockImplementation(() => {})

      await connectionsManagerService.launchCommunityFromStorage()

      expect(purgeArtifactsSpy).toHaveBeenCalledTimes(1)
      expect(purgeDataSpy).toHaveBeenCalledTimes(1)
      expect(launchCommunitySpy).not.toHaveBeenCalled()
      // Marker check runs before getCurrentCommunity, so we never even read the stale
      // community record.
      expect(getCurrentCommunitySpy).not.toHaveBeenCalled()
      expect(fs.existsSync(markerPath())).toBe(false)
    })

    it('leaveCommunity writes the marker before purging and clears it at the end', async () => {
      // The marker's job is to gate the recovery purge — so it must exist at the moment
      // purgeData runs, and be gone after leaveCommunity returns successfully.
      let markerDuringPurge = false
      jest.spyOn(qpsService, 'tombstoneCurrentUserNotificationTokens').mockResolvedValue(true)
      jest.spyOn(connectionsManagerService, 'closeAllServices').mockResolvedValue()
      jest.spyOn(connectionsManagerService['storageService'], 'clean').mockResolvedValue()
      jest.spyOn(connectionsManagerService.libp2pService, 'cleanDatastore').mockResolvedValue()
      jest.spyOn(connectionsManagerService.libp2pService, 'closeDatastore').mockResolvedValue()
      jest.spyOn(connectionsManagerService['storageService'], 'purgeData').mockImplementation(() => {
        markerDuringPurge = fs.existsSync(markerPath())
      })
      jest.spyOn(connectionsManagerService['tor'], 'resetHiddenServices').mockImplementation(() => {})
      jest.spyOn(connectionsManagerService, 'resetState').mockResolvedValue()
      jest.spyOn(localDbService, 'open').mockResolvedValue()
      jest.spyOn(connectionsManagerService, 'openSocket').mockResolvedValue()
      jest.spyOn(qssService, 'resume').mockResolvedValue()

      await connectionsManagerService.leaveCommunity()

      expect(markerDuringPurge).toBe(true)
      expect(fs.existsSync(markerPath())).toBe(false)
    })

    it('leaveCommunity leaves the marker in place when an intermediate step throws', async () => {
      jest.spyOn(qpsService, 'tombstoneCurrentUserNotificationTokens').mockRejectedValueOnce(new Error('boom'))

      await expect(connectionsManagerService.leaveCommunity()).rejects.toThrow('boom')

      expect(fs.existsSync(markerPath())).toBe(true)
    })

    it('recovery at startup leaves the marker in place when purgeArtifacts rejects', async () => {
      // Symmetric to the leaveCommunity-throws test: if recovery itself is interrupted,
      // the marker must survive so a subsequent launch can finish the job.
      fs.mkdirSync(quietDir, { recursive: true })
      fs.writeFileSync(markerPath(), new Date().toISOString())
      jest.spyOn(localDbService, 'purgeArtifacts').mockRejectedValueOnce(new Error('artifacts boom'))
      const purgeDataSpy = jest
        .spyOn(connectionsManagerService['storageService'], 'purgeData')
        .mockImplementation(() => {})

      await expect(connectionsManagerService.launchCommunityFromStorage()).rejects.toThrow('artifacts boom')

      expect(purgeDataSpy).not.toHaveBeenCalled()
      expect(fs.existsSync(markerPath())).toBe(true)
    })

    it('recovery at startup leaves the marker in place when purgeData throws', async () => {
      fs.mkdirSync(quietDir, { recursive: true })
      fs.writeFileSync(markerPath(), new Date().toISOString())
      jest.spyOn(localDbService, 'purgeArtifacts').mockResolvedValue()
      jest.spyOn(connectionsManagerService['storageService'], 'purgeData').mockImplementationOnce(() => {
        throw new Error('data boom')
      })

      await expect(connectionsManagerService.launchCommunityFromStorage()).rejects.toThrow('data boom')

      expect(fs.existsSync(markerPath())).toBe(true)
    })
  })

  it('pre-community artifact erasure preserves TorDataDirectory while purging community storage', async () => {
    const torDataDirectory = path.join(quietDir, 'TorDataDirectory')
    const torCacheFile = path.join(torDataDirectory, 'cached-certs')
    const communityStorageDirectory = path.join(quietDir, 'Ipfs-regression')

    fs.mkdirSync(torDataDirectory, { recursive: true })
    fs.writeFileSync(torCacheFile, 'tor cache')
    fs.mkdirSync(communityStorageDirectory, { recursive: true })

    jest.spyOn(connectionsManagerService['storageService'], 'clean').mockResolvedValue()
    jest.spyOn(connectionsManagerService.libp2pService, 'close').mockResolvedValue()
    jest.spyOn(connectionsManagerService.libp2pService, 'cleanDatastore').mockResolvedValue()
    jest.spyOn(connectionsManagerService.libp2pService, 'closeDatastore').mockResolvedValue()
    jest.spyOn(sigChainService, 'deleteChain').mockResolvedValue()
    jest.spyOn(localDbService, 'purgeArtifacts').mockResolvedValue()
    jest.spyOn(connectionsManagerService['tor'], 'resetHiddenServices').mockImplementation(() => {})
    jest.spyOn(connectionsManagerService, 'resetState').mockResolvedValue()
    jest.spyOn(localDbService, 'open').mockResolvedValue()
    sigChainService.activeChainTeamId = community.teamId

    await (connectionsManagerService as any).erasePreviousCommunityArtifacts()

    expect(fs.existsSync(torCacheFile)).toBe(true)
    expect(fs.existsSync(communityStorageDirectory)).toBe(false)
  })

  it('returns false instead of rejecting when leaveCommunity fails through the socket listener', async () => {
    await connectionsManagerService.init()

    const leaveCommunitySpy = jest
      .spyOn(connectionsManagerService, 'leaveCommunity')
      .mockRejectedValueOnce(new Error('qss tombstone failed'))
    const callback = jest.fn()

    connectionsManagerService['socketService'].emit(SocketActions.LEAVE_COMMUNITY, callback)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(leaveCommunitySpy).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(false)
  })

  describe('updateUserChannelMetadataInFrontend', () => {
    // await connectionsManagerService.init()
    it('skips updates when sigchain not initialized', async () => {
      const channelMetadataSpy = jest.spyOn(connectionsManagerService as any, '_updateChannelMetadataInNativeMobile')
      const updateUsersSpy = jest.spyOn(connectionsManagerService as any, '_updateUsersInStateManager')
      const serverIoEmitSpy = jest.spyOn(serverIoProvider.io, 'emit')

      // the chain was created but isn't stored in memory
      await connectionsManagerService.updateUserChannelMetadataInFrontend('foobar', chain.teamId!)
      expect(channelMetadataSpy).toHaveBeenCalledTimes(0)
      expect(updateUsersSpy).toHaveBeenCalledTimes(0)
      expect(serverIoEmitSpy).not.toHaveBeenCalledWith(SocketEvents.USERS_UPDATED)
      expect(serverIoEmitSpy).not.toHaveBeenCalledWith(SocketEvents.CHANNEL_PERMISSIONS_UPDATED)
      expect(serverIoEmitSpy).not.toHaveBeenCalledWith(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED)
    })

    it('partially updates users but skips mobile channel updates when sigchain initialized but storage not initialized and platform is not ios/android', async () => {
      const channelMetadataSpy = jest.spyOn(connectionsManagerService as any, '_updateChannelMetadataInNativeMobile')
      const updateUsersSpy = jest.spyOn(connectionsManagerService as any, '_updateUsersInStateManager')
      const serverIoEmitSpy = jest.spyOn(serverIoProvider.io, 'emit')

      await sigChainService.loadChain(chain.teamId!, true)
      await connectionsManagerService.updateUserChannelMetadataInFrontend('foobar', chain.teamId!)
      expect(channelMetadataSpy).toHaveBeenCalledTimes(1)
      expect(updateUsersSpy).toHaveBeenCalledTimes(1)
      expect(serverIoEmitSpy).toHaveBeenCalledTimes(2)
      expect(serverIoEmitSpy).toHaveBeenCalledWith(
        SocketEvents.USERS_UPDATED,
        expect.objectContaining({
          users: expect.arrayContaining([
            expect.objectContaining({
              userId: chain.context.user.userId,
              channelIds: [],
              isDuplicated: false,
              isRegistered: true,
              roles: expect.arrayContaining([RoleName.ADMIN, RoleName.MEMBER]),
            }),
          ]),
        })
      )
      expect(serverIoEmitSpy).toHaveBeenCalledWith(
        SocketEvents.CHANNEL_PERMISSIONS_UPDATED,
        expect.objectContaining({
          channelSpecificPermissions: [],
          genericPermissions: {
            private: { create: true },
            public: { create: true, delete: true },
          },
        })
      )
      expect(serverIoEmitSpy).not.toHaveBeenCalledWith(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED)
    })

    it('fully updates users but skips mobile channel updates when fully initialized and platform is not ios/android', async () => {
      const channelMetadataSpy = jest.spyOn(connectionsManagerService as any, '_updateChannelMetadataInNativeMobile')
      const updateUsersSpy = jest.spyOn(connectionsManagerService as any, '_updateUsersInStateManager')
      const serverIoEmitSpy = jest.spyOn(serverIoProvider.io, 'emit')

      chain = await sigChainService.loadChain(chain.teamId!, true)
      await libp2pService.createInstance(await libp2pInstanceParams())
      await storageService.init(chain.teamId)
      await connectionsManagerService.init()

      const channelRolename = chain.channels.create()
      expect(chain.channels.amIMemberOfChannel(channelRolename)).toBeTruthy()
      const privateChannel = (
        await factory.create('PublicChannel', {
          channel: {
            id: randomKey(32),
            owner: chain.user.userId,
            teamId: community.teamId!,
            public: false,
            roleName: channelRolename,
          },
        })
      ).channel as PublicChannel
      const publicChannel = (await factory.create('PublicChannel')).channel as PublicChannel
      const roleNameMappingsSpy = jest
        .spyOn(storageService.channels, 'getPrivateChannelsByRolename')
        .mockImplementation(async () => ({
          idToRoleName: {
            [privateChannel.id]: channelRolename,
          },
          roleNameToChannel: {
            [channelRolename]: privateChannel,
          },
        }))
      const getChannelsSpy = jest.spyOn(storageService.channels, 'getChannels').mockImplementation(async () => {
        return [privateChannel, publicChannel]
      })
      await connectionsManagerService.updateUserChannelMetadataInFrontend('foobar', chain.teamId!)
      expect(roleNameMappingsSpy).toHaveBeenCalledTimes(1)
      expect(channelMetadataSpy).toHaveBeenCalledTimes(1)
      expect(updateUsersSpy).toHaveBeenCalledTimes(1)
      expect(serverIoEmitSpy).toHaveBeenCalledTimes(3)
      expect(serverIoEmitSpy).toHaveBeenCalledWith(
        SocketEvents.USERS_UPDATED,
        expect.objectContaining({
          users: expect.arrayContaining([
            expect.objectContaining({
              userId: chain.context.user.userId,
              channelIds: [privateChannel.id],
              isDuplicated: false,
              isRegistered: true,
              roles: expect.arrayContaining([RoleName.ADMIN, RoleName.MEMBER, channelRolename]),
            }),
          ]),
        })
      )
      expect(serverIoEmitSpy).toHaveBeenCalledWith(
        SocketEvents.CHANNEL_PERMISSIONS_UPDATED,
        expect.objectContaining({
          channelSpecificPermissions: [
            expect.objectContaining({
              addMembers: true,
              removeMembers: true,
              delete: true,
            }),
          ],
          genericPermissions: {
            private: { create: true },
            public: { create: true, delete: true },
          },
        })
      )
      expect(serverIoEmitSpy).not.toHaveBeenCalledWith(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED)
    })

    it.each(['ios', 'android'])(
      'fully updates users and performs mobile channel updates when fully initialized and platform is %s',
      async (platform: string) => {
        Object.defineProperty(process, 'platform', { value: platform })
        const channelMetadataSpy = jest.spyOn(connectionsManagerService as any, '_updateChannelMetadataInNativeMobile')
        const updateUsersSpy = jest.spyOn(connectionsManagerService as any, '_updateUsersInStateManager')
        const serverIoEmitSpy = jest.spyOn(serverIoProvider.io, 'emit')

        chain = await sigChainService.loadChain(chain.teamId!, true)
        await libp2pService.createInstance(await libp2pInstanceParams())
        await storageService.init(chain.teamId)
        await connectionsManagerService.init()

        const channelRolename = chain.channels.create()
        expect(chain.channels.amIMemberOfChannel(channelRolename)).toBeTruthy()
        const privateChannel = (
          await factory.create('PublicChannel', {
            channel: {
              id: randomKey(32),
              owner: chain.user.userId,
              teamId: community.teamId!,
              public: false,
              roleName: channelRolename,
            },
          })
        ).channel as PublicChannel
        const publicChannel = (await factory.create('PublicChannel')).channel as PublicChannel
        const roleNameMappingsSpy = jest
          .spyOn(storageService.channels, 'getPrivateChannelsByRolename')
          .mockImplementation(async () => ({
            idToRoleName: {
              [privateChannel.id]: channelRolename,
            },
            roleNameToChannel: {
              [channelRolename]: privateChannel,
            },
          }))
        const getChannelsSpy = jest.spyOn(storageService.channels, 'getChannels').mockImplementation(async () => {
          return [privateChannel, publicChannel]
        })

        await connectionsManagerService.updateUserChannelMetadataInFrontend('foobar', chain.teamId!)
        expect(roleNameMappingsSpy).toHaveBeenCalledTimes(1)
        expect(channelMetadataSpy).toHaveBeenCalledTimes(1)
        expect(updateUsersSpy).toHaveBeenCalledTimes(1)
        expect(serverIoEmitSpy).toHaveBeenCalledTimes(4)
        expect(serverIoEmitSpy).toHaveBeenCalledWith(
          SocketEvents.USERS_UPDATED,
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({
                userId: chain.context.user.userId,
                channelIds: [privateChannel.id],
                isDuplicated: false,
                isRegistered: true,
                roles: expect.arrayContaining([RoleName.ADMIN, RoleName.MEMBER, channelRolename]),
              }),
            ]),
          })
        )
        expect(serverIoEmitSpy).toHaveBeenCalledWith(
          SocketEvents.CHANNEL_PERMISSIONS_UPDATED,
          expect.objectContaining({
            channelSpecificPermissions: [
              expect.objectContaining({
                addMembers: true,
                removeMembers: true,
                delete: true,
              }),
            ],
            genericPermissions: {
              private: { create: true },
              public: { create: true, delete: true },
            },
          })
        )
        expect(serverIoEmitSpy).toHaveBeenCalledWith(
          SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED,
          expect.objectContaining({
            teamId: chain.teamId!,
            channelMetadata: expect.arrayContaining([
              {
                channelName: privateChannel.name,
                channelId: privateChannel.id,
              },
              {
                channelName: publicChannel.name,
                channelId: publicChannel.id,
              },
            ]),
          })
        )
      }
    )
  })
})
