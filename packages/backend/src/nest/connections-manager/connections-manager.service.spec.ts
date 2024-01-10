import { jest } from '@jest/globals'
import { LazyModuleLoader } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { getFactory, prepareStore, type Store, type communities, type identity } from '@quiet/state-manager'
import { type Community, type Identity, type InitCommunityPayload } from '@quiet/types'
import { type FactoryGirl } from 'factory-girl'
import PeerId from 'peer-id'
import { TestModule } from '../common/test.module'
import { libp2pInstanceParams, removeFilesFromDir } from '../common/utils'
import { QUIET_DIR, TOR_PASSWORD_PROVIDER } from '../const'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { RegistrationModule } from '../registration/registration.module'
import { RegistrationService } from '../registration/registration.service'
import { SocketModule } from '../socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { createLibp2pAddress } from '@quiet/common'
import { OrbitDb } from '../storage/orbitDb/orbitDb.service'
import { EventEmitter } from 'events'
import { create, IPFS } from 'ipfs-core'
import { createRootCA } from '@quiet/identity'
import { Time } from 'pkijs'

//describe('ConnectionsManagerService', () => {
//  let module: TestingModule
//  let connectionsManagerService: ConnectionsManagerService
//  let localDbService: LocalDbService
//  let registrationService: RegistrationService
//  let libp2pService: Libp2pService
//  let lazyModuleLoader: LazyModuleLoader
//  let quietDir: string
//  let store: Store
//  let factory: FactoryGirl
//  let community: Community
//  let userIdentity: Identity
//  let communityRootCa: string
//  let peerId: PeerId
//
//  beforeEach(async () => {
//    jest.clearAllMocks()
//    store = prepareStore().store
//    factory = await getFactory(store)
//    communityRootCa = 'rootCa'
//    community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community', {
//      rootCa: communityRootCa,
//    })
//    userIdentity = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
//      id: community.id,
//      nickname: 'john',
//    })
//
//    module = await Test.createTestingModule({
//      imports: [TestModule, ConnectionsManagerModule, LocalDbModule, RegistrationModule, SocketModule, Libp2pModule],
  //    })
  //      .overrideProvider(TOR_PASSWORD_PROVIDER)
  //      .useValue({ torPassword: '', torHashedPassword: '' })
//      .compile()
//
//    connectionsManagerService = await module.resolve(ConnectionsManagerService)
//    localDbService = await module.resolve(LocalDbService)
//    registrationService = await module.resolve(RegistrationService)
//
//    lazyModuleLoader = await module.resolve(LazyModuleLoader)
//    const { Libp2pModule: Module } = await import('../libp2p/libp2p.module')
//    const moduleRef = await lazyModuleLoader.load(() => Module)
//    const { Libp2pService } = await import('../libp2p/libp2p.service')
//    libp2pService = moduleRef.get(Libp2pService)
//    const params = await libp2pInstanceParams()
//    peerId = params.peerId
//    await libp2pService.createInstance(params)
//    expect(libp2pService.libp2pInstance).not.toBeNull()
//
//    connectionsManagerService.libp2pService = libp2pService
//
//    quietDir = await module.resolve(QUIET_DIR)
//  })
//
//  afterEach(async () => {
//    await libp2pService.libp2pInstance?.stop()
//    if (connectionsManagerService) {
//      await connectionsManagerService.closeAllServices()
//    }
//    removeFilesFromDir(quietDir)
//  })
//
//  afterAll(async () => {
//    await module.close()
//  })
//
//  it('should be defined', () => {
//    expect(connectionsManagerService).toBeDefined()
//  })
//
//  it('launches community on init if its data exists in local db', async () => {
//    const launchCommunityPayload: InitCommunityPayload = {
//      id: community.id,
//      peerId: userIdentity.peerId,
//      hiddenService: userIdentity.hiddenService,
//      certs: {
//        // @ts-expect-error
//        certificate: userIdentity.userCertificate,
//        // @ts-expect-error
//        key: userIdentity.userCsr?.userKey,
//        CA: [communityRootCa],
//      },
//      peers: [
//        createLibp2pAddress(
//          'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
//          'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
//        ),
//      ],
//    }
//
//    await localDbService.put(LocalDBKeys.COMMUNITY, launchCommunityPayload)
//    await connectionsManagerService.closeAllServices()
//
//    const launchCommunitySpy = jest.spyOn(connectionsManagerService, 'launchCommunity').mockResolvedValue()
//
//    await connectionsManagerService.init()
//    expect(launchCommunitySpy).toHaveBeenCalledWith(launchCommunityPayload)
//  })
//
//  it('does not launch community on init if its data does not exist in local db', async () => {
//    await connectionsManagerService.closeAllServices()
//    await connectionsManagerService.init()
//    const launchCommunitySpy = jest.spyOn(connectionsManagerService, 'launchCommunity')
//    expect(launchCommunitySpy).not.toHaveBeenCalled()
//  })
//
//  // At this moment, that test have to be skipped, because checking statues is called before launchCommunity method
//  it.skip('community is only launched once', async () => {
//    const launchCommunityPayload: InitCommunityPayload = {
//      id: community.id,
//      peerId: userIdentity.peerId,
//      hiddenService: userIdentity.hiddenService,
//      certs: {
//        // @ts-expect-error
//        certificate: userIdentity.userCertificate,
//        // @ts-expect-error
//        key: userIdentity.userCsr?.userKey,
//        CA: [communityRootCa],
//      },
//      peers: community.peerList,
//    }
//
//    //@ts-ignore
//    const launchSpy = jest.spyOn(connectionsManagerService, 'launch').mockResolvedValue('address')
//
//    await Promise.all([
//      connectionsManagerService.launchCommunity(launchCommunityPayload),
//      connectionsManagerService.launchCommunity(launchCommunityPayload),
//    ])
//
//    expect(launchSpy).toBeCalledTimes(1)
//  })
//
//  it('Bug reproduction - Error on startup - Error: TOR: Connection already established - Trigger launchCommunity from backend and state manager', async () => {
//    const launchCommunityPayload: InitCommunityPayload = {
//      id: community.id,
//      peerId: userIdentity.peerId,
//      hiddenService: userIdentity.hiddenService,
//      certs: {
//        // @ts-expect-error
//        certificate: userIdentity.userCertificate,
//        // @ts-expect-error
//        key: userIdentity.userCsr?.userKey,
//        CA: [communityRootCa],
//      },
//      peers: community.peerList,
//    }
//
//    // await connectionsManager.init()
//    await localDbService.put(LocalDBKeys.COMMUNITY, launchCommunityPayload)
//
//    const peerid = 'QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix'
//    await localDbService.put(LocalDBKeys.PEERS, {
//      [peerid]: {
//        peerId: peerid,
//        connectionTime: 50,
//        lastSeen: 1000,
//      },
//    })
//
//    await connectionsManagerService.closeAllServices()
//
//    const launchCommunitySpy = jest.spyOn(connectionsManagerService, 'launchCommunity').mockResolvedValue()
//
//    await connectionsManagerService.init()
//
//    expect(launchCommunitySpy).toBeCalledTimes(1)
//  })
//})

describe('ConnectionsManagerService integration', () => {
  let module: TestingModule
  let connectionsManagerService: ConnectionsManagerService
  let localDbService: LocalDbService
  let registrationService: RegistrationService
  let libp2pService: Libp2pService
  let lazyModuleLoader: LazyModuleLoader
  let quietDir: string
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let userIdentity: Identity
  let communityRootCa: string
  let peerId: PeerId
  let orbitDb: OrbitDb
  let ipfs: IPFS

  beforeEach(async () => {
    jest.clearAllMocks()
    store = prepareStore().store
    factory = await getFactory(store)
    communityRootCa = 'rootCa'
    community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community', {
      rootCa: communityRootCa,
    })
    userIdentity = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    module = await Test.createTestingModule({
      imports: [TestModule, ConnectionsManagerModule, LocalDbModule, RegistrationModule, SocketModule, Libp2pModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: '', torHashedPassword: '' })
      .compile()

    connectionsManagerService = await module.resolve(ConnectionsManagerService)
    localDbService = await module.resolve(LocalDbService)
    registrationService = await module.resolve(RegistrationService)
    registrationService.onModuleInit()

    const certRoot = await createRootCA(
      new Time({ type: 1, value: new Date() }),
      new Time({ type: 1, value: new Date(2030, 1, 1) }),
      'testRootCA'
    )
    registrationService.permsData = { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }

    lazyModuleLoader = await module.resolve(LazyModuleLoader)
    const { Libp2pModule: Module } = await import('../libp2p/libp2p.module')
    const moduleRef = await lazyModuleLoader.load(() => Module)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    libp2pService = moduleRef.get(Libp2pService)
    const params = await libp2pInstanceParams()
    peerId = params.peerId
    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()

    connectionsManagerService.libp2pService = libp2pService

    quietDir = await module.resolve(QUIET_DIR)
  })

  afterEach(async () => {
    await libp2pService.libp2pInstance?.stop()
    if (connectionsManagerService) {
      await connectionsManagerService.closeAllServices()
    }
    removeFilesFromDir(quietDir)
  })

  afterAll(async () => {
    await module.close()
    await orbitDb.stop()
    await ipfs.stop()
  })

  it('should work well', async () => {
    await connectionsManagerService.init()

    orbitDb = await module.resolve(OrbitDb)
    const peerId = await PeerId.create()
    ipfs = await create()
    await orbitDb.create(peerId, ipfs)

    // @ts-ignore
    await connectionsManagerService.storageService.attachCsrsStoreListeners()

    // @ts-ignore
    await connectionsManagerService.storageService.certificatesRequestsStore.init(connectionsManagerService.storageService)
    // @ts-ignore
    await connectionsManagerService.storageService.certificatesStore.init(connectionsManagerService.storageService)

    // @ts-ignore
    await connectionsManagerService.storageService.certificatesRequestsStore.addUserCsr(
      'MIIDITCCAsYCAQAwSTFHMEUGA1UEAxM+anR3c3hxMnZ1dWthY3JodWhvdnAzd2JxbzRxNXc0d2s3Nm1qbWJ3cXk3eGNma2FsdmRxb3hhYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQE2q6iS+WCmIVCSFI2AjHrW6ujUdrceD5T2xkcTJBTn0y50WphcupUajCRgkXaTBkTsGNJ3qWRZAKX7CiuehBJoIICGTAuBgkqhkiG9w0BCQ4xITAfMB0GA1UdDgQWBBQuE5JgPY/BYBpgG5pnjMkEEIkrGjCCAUcGCSqGSIb3DQEJDDGCATgEggE0BDlx84glBl72q82F2a+y8iTVKM8IMiXYYrmNyhFPj6XsfVQpvLhNviZ5zHdMBWbFj44vTSUIasNP9I9eCWSEAaEJqjngEh18WCRS/XbvQxI/8qB5pzcfghvM8BCgSLbSEjK2GMYVhCXmRH1YGHIZu0+Ii9pe5nwG154JlPUsmIRgu6ruY6PQk65Aoo4OyhPn5CCUFInptHcz1JpAiCRe0Z6wuQHud03VY50fx4ETdmUNJBEIPOyd/Xn6lMOi6SaWGHbCWiufeJRm+mRdoHJAEt6kPLhGIYGyduNT/8cGoe2xKyQDvNoTr4dqqRZ2HgZ18nicsTHswpGqAlUnZXaA3V85Qu1cvaMAqEoPOUlGP9AriIVwtIZM0hdWHqKHgBCZrKfHb5oLxt6ourQ3+q19tvx+u6UwFAYKKwYBBAGDjBsCATEGEwRlbGxvMD0GCSsGAQIBDwMBATEwEy5RbVVvNXN0NXNqR3RFMUtQeXhOVW5pTWhnQXduV0JVNXk3TnpoMlpRRkdacVdiMEcGA1UdETFAEz5qdHdzeHEydnV1a2Fjcmh1aG92cDN3YnFvNHE1dzR3azc2bWptYndxeTd4Y2ZrYWx2ZHFveGFhZC5vbmlvbjAKBggqhkjOPQQDAgNJADBGAiEAt9udw7B7vnjJyWvkkRLb7DImFXwsrSxirqbmhIH+1rUCIQD86GWyfAE2d8gCNAn4h1t9B+mAx33ZdPLgFssHl1i3pA=='
    )

    // @ts-ignore
    console.log(await connectionsManagerService.storageService.certificatesRequestsStore.getCsrs())

    // @ts-ignore
    connectionsManagerService.storageService.certificatesRequestsStore.store.events.emit('replicated')
    // @ts-ignore
    connectionsManagerService.storageService.certificatesRequestsStore.store.events.emit('replicated')

    await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
  })
})
