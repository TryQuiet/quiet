import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { getReduxStoreFactory, prepareStore, type Store } from '@quiet/state-manager'
import { CommunityOwnership, type Community, type Identity } from '@quiet/types'
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
})
