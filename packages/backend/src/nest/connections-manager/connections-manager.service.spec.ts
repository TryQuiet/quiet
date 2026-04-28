import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { getReduxStoreFactory, prepareStore, type Store } from '@quiet/state-manager'
import { CommunityOwnership, SocketActions, SocketEvents, type Community, type Identity } from '@quiet/types'
import { type FactoryGirl } from 'factory-girl'
import { TestModule } from '../common/test.module'
import { removeFilesFromDir } from '../common/utils'
import { QUIET_DIR, TOR_PASSWORD_PROVIDER } from '../const'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { SocketModule } from '../socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { createLibp2pAddress } from '@quiet/common'

import { createLogger } from '../common/logger'
import { SigChainService } from '../auth/sigchain.service'
import { StorageModule } from '../storage/storage.module'
import { QSSService } from '../qss/qss.service'
import { Libp2pEvents } from '../libp2p/libp2p.types'
import { QSSOperationResult, QSSEvents } from '../qss/qss.types'
import { QPSService } from '../qps/qps.service'
import waitForExpect from 'wait-for-expect'

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
  let qssService: QSSService
  let qpsService: QPSService

  beforeEach(async () => {
    jest.clearAllMocks()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    communityRootCa = 'rootCa'
    community = await factory.create('Community', {
      rootCa: communityRootCa,
    })
    userIdentity = await factory.create('Identity', {
      communityId: community.id,
    })

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
    qpsService = await module.resolve(QPSService)
    localDbService.open()

    // initialize sigchain on local db
    await sigChainService.createChain(community.name!, 'john', false)
    await sigChainService.saveChain(community.name!)
    await sigChainService.deleteChain(community.name!, false)
    quietDir = await module.resolve(QUIET_DIR)
  })

  afterEach(async () => {
    if (connectionsManagerService) {
      await connectionsManagerService.closeAllServices()
    }
    removeFilesFromDir(quietDir)
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

  it('pauses and resumes qss alongside the mobile lifecycle', async () => {
    const closeSocketSpy = jest.spyOn(connectionsManagerService, 'closeSocket').mockResolvedValue()
    const openSocketSpy = jest.spyOn(connectionsManagerService, 'openSocket').mockResolvedValue()
    const libp2pPauseSpy = jest.spyOn(connectionsManagerService.libp2pService, 'pause').mockResolvedValue(true)
    const libp2pResumeSpy = jest.spyOn(connectionsManagerService.libp2pService, 'resume').mockResolvedValue(true)
    const qssPauseSpy = jest.spyOn(qssService, 'pause').mockImplementation(() => {})
    const qssResumeSpy = jest.spyOn(qssService, 'resume').mockResolvedValue(QSSOperationResult.SUCCESS)

    await connectionsManagerService.pause()
    expect(qssPauseSpy).toHaveBeenCalledTimes(1)
    expect(closeSocketSpy).toHaveBeenCalledTimes(1)
    expect(libp2pPauseSpy).toHaveBeenCalledTimes(1)

    await connectionsManagerService.resume()
    expect(openSocketSpy).toHaveBeenCalledTimes(1)
    expect(libp2pResumeSpy).toHaveBeenCalledTimes(1)
    expect(qssResumeSpy).toHaveBeenCalledTimes(1)
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
    const addTeamIdToDbMetasSpy = jest
      .spyOn(connectionsManagerService['storageService'], 'addTeamIdToDbMetas')
      .mockImplementation(() => {})

    await connectionsManagerService.launch(community)

    qssService.emit(QSSEvents.QSS_FULLY_JOINED, teamId)
    connectionsManagerService.libp2pService.emit(Libp2pEvents.AUTH_JOINED, { peer: 'peer-id' })

    await waitForExpect(() => expect(storageInitSpy).toHaveBeenCalledTimes(1))
    expect(addTeamIdToDbMetasSpy).not.toHaveBeenCalled()

    resolveStorageInit!()

    await waitForExpect(() => expect(addTeamIdToDbMetasSpy).toHaveBeenCalledTimes(1))
    expect(addTeamIdToDbMetasSpy).toHaveBeenCalledWith(teamId)
  })

  it('attempts notification token tombstoning before closing services and still leaves if it is not acked', async () => {
    const tombstoneSpy = jest.spyOn(qpsService, 'tombstoneCurrentUserNotificationTokens').mockResolvedValue(false)
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

    await connectionsManagerService.leaveCommunity()

    expect(tombstoneSpy).toHaveBeenCalledTimes(1)
    expect(closeAllServicesSpy).toHaveBeenCalledTimes(1)
    expect(tombstoneSpy.mock.invocationCallOrder[0]).toBeLessThan(closeAllServicesSpy.mock.invocationCallOrder[0])

    storageCleanSpy.mockRestore()
    cleanDatastoreSpy.mockRestore()
    closeDatastoreSpy.mockRestore()
    purgeDataSpy.mockRestore()
    resetHiddenServicesSpy.mockRestore()
    resetStateSpy.mockRestore()
    localDbOpenSpy.mockRestore()
    openSocketSpy.mockRestore()
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
})
