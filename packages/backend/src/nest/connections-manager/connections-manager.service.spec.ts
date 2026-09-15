import { expect, jest } from '@jest/globals'

import fs from 'fs'
import path from 'path'
import { Test, TestingModule } from '@nestjs/testing'
import { getReduxStoreFactory, prepareStore, type Store } from '@quiet/state-manager'
import {
  CommunityOwnership,
  InvitationKind,
  SocketActions,
  type Community,
  type DeviceInvitationDataV5,
  type DeviceLinkInvite,
  type Identity,
  SocketEvents,
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
import { createLibp2pAddress, createLocalAddress, validInvitationDatav4, validInvitationDatav5 } from '@quiet/common'

import { createLogger } from '../common/logger'
import { SigChainService } from '../auth/sigchain.service'
import { StorageModule } from '../storage/storage.module'
import { QSSService } from '../qss/qss.service'
import { QSSSyncManager } from '../qss/qss-sync-manager.service'
import { QPSService } from '../qps/qps.service'
import waitForExpect from 'wait-for-expect'
import { CaptchaService } from '../captcha/captcha.service'
import type { SigChain } from '../auth/sigchain'
import { CommunityLifecycle } from '../admission/community-lifecycle'
import { AdmissionCoordinator } from '../admission/admission-coordinator.service'
import { AdmissionError, AdmissionKind, AdmissionTransport } from '../admission/admission.types'
import { ServiceState } from './connections-manager.types'
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
  let admissionCoordinator: AdmissionCoordinator
  let chain: SigChain
  let serverIoProvider: ServerIoProviderTypes
  let channelsService: ChannelsService
  let storageService: StorageService
  let libp2pService: Libp2pService
  const originalPlatform = process.platform as string

  const deviceInvitationData = {
    pairs: validInvitationDatav5[0].pairs,
    psk: validInvitationDatav5[0].psk,
    kind: InvitationKind.Device,
    version: validInvitationDatav5[0].version,
    authData: {
      communityName: validInvitationDatav5[0].authData.communityName,
      seed: validInvitationDatav5[0].authData.seed,
      teamId: validInvitationDatav5[0].authData.teamId,
      userId: 'linked-user-id',
      userName: 'linked-user-name',
    },
    qssEnabled: validInvitationDatav5[0].qssEnabled,
    qssEndpoint: validInvitationDatav5[0].qssEndpoint,
  } satisfies DeviceInvitationDataV5

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
    admissionCoordinator = await module.resolve(AdmissionCoordinator)
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
      fs.rmSync(connectionsManagerService['admissionResetReceiptPath'](), { force: true })
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

  it('creates and launches a local identity without Tor using its persisted port', async () => {
    const previousIsE2e = process.env.IS_E2E
    const previousLocalTransport = process.env.LOCAL_TRANSPORT
    process.env.IS_E2E = 'true'
    process.env.LOCAL_TRANSPORT = 'true'
    try {
      connectionsManagerService['ports'] = {
        socksPort: 43_000,
        libp2pHiddenService: 43_001,
        controlPort: 43_002,
        dataServer: 43_003,
        httpTunnelPort: 43_004,
      }
      const createHiddenServiceSpy = jest.spyOn(connectionsManagerService['tor'], 'createNewHiddenService')
      const spawnHiddenServiceSpy = jest.spyOn(connectionsManagerService, 'spawnTorHiddenService')

      const network = await connectionsManagerService.getNetworkInfo()

      expect(network.hiddenService).toEqual({
        onionAddress: createLocalAddress(43_001),
        privateKey: '',
      })
      expect(createHiddenServiceSpy).not.toHaveBeenCalled()

      const persistedPort = 43_101
      const localIdentity: Identity = {
        ...userIdentity,
        networkInfo: {
          ...network,
          hiddenService: {
            onionAddress: createLocalAddress(persistedPort),
            privateKey: '',
          },
        },
      }
      jest.spyOn(connectionsManagerService['storageService'], 'getIdentity').mockResolvedValue(localIdentity)
      const createInstanceSpy = jest
        .spyOn(connectionsManagerService.libp2pService, 'createInstance')
        .mockResolvedValue(undefined as any)
      jest.spyOn(connectionsManagerService['storageService'], 'init').mockResolvedValue()
      jest.spyOn(sigChainService, 'getActiveChain').mockReturnValue({
        team: { id: community.teamId },
        roles: { amIMemberOfRole: () => true },
      } as any)

      await connectionsManagerService.launch(community)

      expect(spawnHiddenServiceSpy).not.toHaveBeenCalled()
      expect(createInstanceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          listenAddresses: [`/ip4/127.0.0.1/tcp/${persistedPort}/ws`],
          localAddress: expect.stringMatching(
            new RegExp(`^/ip4/127\\.0\\.0\\.1/tcp/${persistedPort}/ws/p2p/[a-zA-Z0-9]{52}$`)
          ),
          targetPort: persistedPort,
          agent: undefined,
          torBootstrap: undefined,
        }),
        expect.any(AbortSignal)
      )
    } finally {
      if (previousIsE2e == null) {
        delete process.env.IS_E2E
      } else {
        process.env.IS_E2E = previousIsE2e
      }
      if (previousLocalTransport == null) {
        delete process.env.LOCAL_TRANSPORT
      } else {
        process.env.LOCAL_TRANSPORT = previousLocalTransport
      }
    }
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

    const launchCommunitySpy = jest
      .spyOn(connectionsManagerService as any, 'launchCommunityLocked')
      .mockResolvedValue(undefined)

    await connectionsManagerService.init()
    await connectionsManagerService.initializeStoredCommunity()

    expect(launchCommunitySpy).toHaveBeenCalledTimes(1)
  })

  it('does not launch community on init if its data does not exist in local db', async () => {
    logger.info('does not launch community on init if its data does not exist in local db')
    await connectionsManagerService.closeAllServices()
    const launchCommunitySpy = jest.spyOn(connectionsManagerService as any, 'launchCommunityLocked')
    await connectionsManagerService.init()
    await connectionsManagerService.initializeStoredCommunity()
    expect(launchCommunitySpy).not.toHaveBeenCalled()
  })

  it('purges an interrupted device link on startup when no admitted sigchain was persisted', async () => {
    const interruptedCommunity: Community = {
      ...community,
      teamId: deviceInvitationData.authData.teamId,
      inviteData: deviceInvitationData,
    }
    jest.spyOn(localDbService, 'getCurrentCommunity').mockResolvedValue(interruptedCommunity)
    jest
      .spyOn(sigChainService, 'loadChain')
      .mockRejectedValue(new Error('pending chain was intentionally not persisted'))
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)
    const launchCommunitySpy = jest
      .spyOn(connectionsManagerService as any, 'launchCommunityLocked')
      .mockResolvedValue(undefined)

    await connectionsManagerService.launchCommunityFromStorage()

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(launchCommunitySpy).not.toHaveBeenCalled()
  })

  it.each([
    { backend: 'mobile', port: undefined, cookie: undefined },
    { backend: 'mobile', port: 12345, cookie: undefined },
    { backend: 'mobile', port: 12345, cookie: 'cookie' },
    { backend: 'desktop', port: 12345, cookie: undefined },
  ])(
    'initializes once without blocking for backend=$backend port=$port cookie=$cookie',
    async ({ backend, port, cookie }) => {
      const previousBackend = process.env.BACKEND
      const previousAuthCookie = connectionsManagerService.configOptions.torAuthCookie
      const previousControlPort = connectionsManagerService.configOptions.torControlPort
      process.env.BACKEND = backend
      connectionsManagerService.configOptions.torAuthCookie = cookie
      connectionsManagerService.configOptions.torControlPort = port
      const migrateSpy = jest.spyOn(connectionsManagerService, 'migrateLevelDb').mockResolvedValue()
      let resolveLaunch!: () => void
      const launchPending = new Promise<void>(resolve => {
        resolveLaunch = resolve
      })
      const launchSpy = jest
        .spyOn(connectionsManagerService, 'launchCommunityFromStorage')
        .mockReturnValue(launchPending)

      try {
        await connectionsManagerService.init()

        expect(migrateSpy).toHaveBeenCalledTimes(1)
        expect(launchSpy).toHaveBeenCalledTimes(1)

        const firstInitialization = connectionsManagerService.initializeStoredCommunity()
        const secondInitialization = connectionsManagerService.initializeStoredCommunity()
        expect(firstInitialization).toBe(secondInitialization)

        let initializationResolved = false
        void firstInitialization.then(() => {
          initializationResolved = true
        })
        await Promise.resolve()
        expect(initializationResolved).toBe(false)

        resolveLaunch()
        await firstInitialization

        expect(migrateSpy).toHaveBeenCalledTimes(1)
        expect(launchSpy).toHaveBeenCalledTimes(1)
      } finally {
        if (previousBackend === undefined) {
          delete process.env.BACKEND
        } else {
          process.env.BACKEND = previousBackend
        }
        connectionsManagerService.configOptions.torAuthCookie = previousAuthCookie
        connectionsManagerService.configOptions.torControlPort = previousControlPort
      }
    }
  )

  it('waits for the stored onion address to be published before returning it', async () => {
    connectionsManagerService['ports'] = {
      socksPort: 9001,
      libp2pHiddenService: 9002,
      controlPort: 9003,
      dataServer: 9004,
      httpTunnelPort: 9005,
    }
    const tor = connectionsManagerService['tor']
    let resolvePublication!: () => void
    const publication = new Promise<void>(resolve => {
      resolvePublication = resolve
    })
    const registerHiddenService = jest.spyOn(tor, 'registerHiddenService').mockReturnValue(publication)
    const spawnHiddenService = jest.spyOn(tor, 'spawnHiddenService')

    const onionAddress = connectionsManagerService.spawnTorHiddenService(community.id, userIdentity)
    let resolved = false
    void onionAddress.then(() => {
      resolved = true
    })
    await Promise.resolve()

    expect(resolved).toBe(false)
    expect(registerHiddenService).toHaveBeenCalledWith({
      targetPort: 9002,
      privKey: userIdentity.networkInfo.hiddenService.privateKey,
      onionAddress: userIdentity.networkInfo.hiddenService.onionAddress,
      virtPort: 80,
    })
    expect(spawnHiddenService).not.toHaveBeenCalled()

    resolvePublication()
    await expect(onionAddress).resolves.toBe(userIdentity.networkInfo.hiddenService.onionAddress)
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

  it('allows launch to be retried after a launch failure', async () => {
    await localDbService.setCommunity(community)
    jest.spyOn(sigChainService, 'loadChain').mockResolvedValue(chain)
    const launchSpy = jest
      .spyOn(connectionsManagerService, 'launch')
      .mockRejectedValueOnce(new Error('launch failed'))
      .mockResolvedValueOnce()

    await connectionsManagerService.launchCommunity(community.id)
    expect(connectionsManagerService.communityState).toBe(ServiceState.DEFAULT)

    await connectionsManagerService.launchCommunity(community.id)
    expect(launchSpy).toHaveBeenCalledTimes(2)
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

    expect(loadChainSpy).toHaveBeenCalledWith(community.teamId, true, community.name)
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
    expect(closeSocketSpy).not.toHaveBeenCalled()
    expect(libp2pPauseSpy).toHaveBeenCalledTimes(1)

    await connectionsManagerService.resume()
    expect(listenSpy).not.toHaveBeenCalled()
    expect(libp2pResumeSpy).toHaveBeenCalledTimes(1)
    expect(qssResumeSpy).toHaveBeenCalledTimes(1)
  })

  it('acknowledges an accepted P2P resume while Tor bootstrap is pending', async () => {
    await connectionsManagerService.init()
    const resumeSpy = jest.spyOn(connectionsManagerService.libp2pService, 'resume').mockResolvedValue(true)
    const startSyncSpy = jest.spyOn(connectionsManagerService['storageService'], 'startSync').mockResolvedValue()
    const callback = jest.fn()

    connectionsManagerService['socketService'].emit(SocketActions.TOGGLE_P2P, true, callback)
    await waitForExpect(() => expect(callback).toHaveBeenCalledWith(true))

    expect(resumeSpy).toHaveBeenCalledTimes(1)
    expect(startSyncSpy).toHaveBeenCalledTimes(1)
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
    expect(listenSpy).not.toHaveBeenCalled()
    expect(qssResumeSpy).not.toHaveBeenCalled()

    resolveLibp2pResume(true)
    await resumePromise

    expect(qssResumeSpy).toHaveBeenCalledTimes(1)
    expect(libp2pResumeSpy.mock.invocationCallOrder[0]).toBeLessThan(qssResumeSpy.mock.invocationCallOrder[0])
  })

  it.each([
    { admission: AdmissionKind.MEMBER, isPendingDeviceAdmission: false, transport: AdmissionTransport.QSS },
    { admission: AdmissionKind.DEVICE, isPendingDeviceAdmission: true, transport: AdmissionTransport.QSS },
    { admission: AdmissionKind.DEVICE, isPendingDeviceAdmission: true, transport: AdmissionTransport.P2P },
    { admission: AdmissionKind.MEMBER, isPendingDeviceAdmission: false, transport: AdmissionTransport.P2P },
  ])(
    'launches after $admission admission through $transport without waiting for optional QSS',
    async ({ admission, isPendingDeviceAdmission, transport }) => {
      const qssEndpoint = 'https://qss.example.test'
      const baseInviteData = admission === AdmissionKind.MEMBER ? validInvitationDatav5[0] : deviceInvitationData
      const teamId = baseInviteData.authData.teamId
      const inviteData = {
        ...baseInviteData,
        qssEnabled: true,
        qssEndpoint,
      }
      const linkedCommunity: Community = {
        ...community,
        teamId,
        inviteData,
        qssEnabled: true,
        qssEndpoint,
      }
      await localDbService.setCommunity(linkedCommunity)
      const pendingChain = {
        team: null,
        isPendingDeviceAdmission,
        device: { deviceId: 'admitted-device' },
        roles: { amIMemberOfRole: () => false },
      }
      let resolveAdmission!: (result: {
        teamId: string
        userId: string
        deviceId: string
        transport: AdmissionTransport
      }) => void
      const admissionPromise = new Promise<any>(resolve => {
        resolveAdmission = resolve
      })

      jest.spyOn(connectionsManagerService['storageService'], 'getIdentity').mockResolvedValue(userIdentity)
      jest.spyOn(connectionsManagerService, 'spawnTorHiddenService').mockResolvedValue('localhost.onion')
      const libp2pCreateSpy = jest
        .spyOn(connectionsManagerService.libp2pService, 'createInstance')
        .mockResolvedValue(undefined as any)
      jest.spyOn(connectionsManagerService['storageService'], 'init').mockResolvedValue()
      jest.spyOn(connectionsManagerService['tor'], 'isBootstrappingFinished').mockResolvedValue(false)
      jest.spyOn(sigChainService, 'getActiveChain').mockReturnValue(pendingChain as any)
      const coordinateSpy = jest.spyOn(admissionCoordinator, 'start').mockReturnValue({
        id: 'session',
        result: admissionPromise,
        drained: Promise.resolve(),
        cancel: async () => undefined,
      })
      connectionsManagerService['ports'] = {
        socksPort: 9001,
        libp2pHiddenService: 9002,
        controlPort: 9003,
        dataServer: 9004,
        httpTunnelPort: 9005,
      }

      let finishQss!: () => void
      const qssPending = new Promise<void>(resolve => {
        finishQss = resolve
      })
      const qssResume = jest.spyOn(qssService, 'resume').mockImplementation(() => qssPending)
      const qssAuth = jest.spyOn(qssService, 'authenticateCurrentCommunity').mockResolvedValue()
      if (transport === AdmissionTransport.P2P && admission === AdmissionKind.MEMBER) {
        qssResume.mockRejectedValue(new Error('QSS unavailable'))
      }
      const launchPromise = connectionsManagerService.launch(linkedCommunity)
      await waitForExpect(() => expect(coordinateSpy).toHaveBeenCalledTimes(1))
      expect(libp2pCreateSpy).not.toHaveBeenCalled()

      expect(coordinateSpy.mock.calls[0][0]).toMatchObject({
        communityId: linkedCommunity.id,
        teamId,
        expectedUserId: userIdentity.userId,
        expectedDeviceId: 'admitted-device',
        kind: admission,
        preferredTransport: AdmissionTransport.QSS,
      })
      resolveAdmission({
        teamId,
        userId: userIdentity.userId,
        deviceId: 'admitted-device',
        transport,
      })
      try {
        await launchPromise
        if (transport === AdmissionTransport.P2P) {
          expect(qssResume).toHaveBeenCalledTimes(1)
          expect(qssAuth).not.toHaveBeenCalled()
        }
      } finally {
        connectionsManagerService['communityLifecycle']?.revoke(new Error('test launch finished'))
        finishQss()
      }

      expect(libp2pCreateSpy).toHaveBeenCalledTimes(1)
      expect(connectionsManagerService['storageService'].init).toHaveBeenCalledWith(teamId)
      expect(await localDbService.getCommunity(linkedCommunity.id)).toMatchObject({ inviteData: null })
      expect(coordinateSpy.mock.invocationCallOrder[0]).toBeLessThan(libp2pCreateSpy.mock.invocationCallOrder[0])
    }
  )

  it('scrubs the invite and refuses reset when pause cancels startup after admission commit', async () => {
    const teamId = deviceInvitationData.authData.teamId
    const linkedCommunity: Community = {
      ...community,
      id: 'post-commit-community',
      teamId,
      inviteData: { ...deviceInvitationData, qssEnabled: false },
      qssEnabled: false,
      qssEndpoint: undefined,
    }
    const linkedIdentity = {
      ...userIdentity,
      communityId: linkedCommunity.id,
      userId: deviceInvitationData.authData.userId,
    }
    await localDbService.setCommunity(linkedCommunity)
    await localDbService.setIdentity(linkedIdentity)

    const pendingChain = {
      team: null,
      isPendingDeviceAdmission: true,
      device: { deviceId: 'post-commit-device' },
      roles: { amIMemberOfRole: () => false },
    }
    const admittedChain = {
      team: { id: teamId },
      isPendingDeviceAdmission: false,
      device: { deviceId: 'post-commit-device' },
      roles: { amIMemberOfRole: () => true },
    }
    let activeChain: any = pendingChain
    sigChainService.activeChainTeamId = teamId
    jest.spyOn(sigChainService, 'getActiveChain').mockImplementation(() => activeChain)
    jest.spyOn(connectionsManagerService, 'spawnTorHiddenService').mockResolvedValue('localhost.onion')
    jest.spyOn(connectionsManagerService.libp2pService, 'createInstance').mockResolvedValue(undefined as any)
    jest.spyOn(connectionsManagerService.libp2pService, 'pause').mockResolvedValue(true)
    jest.spyOn(qssService, 'pause').mockImplementation(() => {})
    const eraseArtifactsSpy = jest.spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')

    let resolveAdmission!: (result: any) => void
    const admission = new Promise<any>(resolve => {
      resolveAdmission = resolve
    })
    jest.spyOn(admissionCoordinator, 'start').mockReturnValue({
      id: 'post-commit-session',
      result: admission,
      drained: Promise.resolve(),
      cancel: async () => undefined,
    })
    let finishStorage!: () => void
    const storageHeld = new Promise<void>(resolve => {
      finishStorage = resolve
    })
    const storageInitSpy = jest.spyOn(storageService, 'init').mockReturnValue(storageHeld)
    connectionsManagerService['ports'] = {
      socksPort: 9001,
      libp2pHiddenService: 9002,
      controlPort: 9003,
      dataServer: 9004,
      httpTunnelPort: 9005,
    }

    const launch = connectionsManagerService.launchCommunity(linkedCommunity.id)
    await waitForExpect(() => expect(admissionCoordinator.start).toHaveBeenCalledTimes(1))
    activeChain = admittedChain
    resolveAdmission({
      teamId,
      userId: linkedIdentity.userId,
      deviceId: 'post-commit-device',
      transport: AdmissionTransport.P2P,
    })
    await waitForExpect(() => expect(storageInitSpy).toHaveBeenCalledWith(teamId))

    const pause = connectionsManagerService.pause()
    finishStorage()
    await pause
    await launch

    expect(await localDbService.getCommunity(linkedCommunity.id)).toMatchObject({ inviteData: null })
    expect(connectionsManagerService['interruptedAdmissionCommunityId']).toBeUndefined()
    await expect(connectionsManagerService.resetAdmission(linkedCommunity.id)).resolves.toBe(false)
    expect(eraseArtifactsSpy).not.toHaveBeenCalled()
  })

  it('does not start libp2p or storage when coordinated admission fails', async () => {
    const teamId = deviceInvitationData.authData.teamId
    const userId = deviceInvitationData.authData.userId
    const linkedCommunity: Community = {
      ...community,
      teamId,
      inviteData: deviceInvitationData,
      qssEnabled: true,
      qssEndpoint: 'https://qss.example.test',
      qssSetup: true,
    }
    const pendingChain = {
      team: null,
      isPendingDeviceAdmission: true,
      device: { deviceId: 'pending-device' },
      roles: { amIMemberOfRole: () => false },
    }
    const linkedIdentity = { ...userIdentity, communityId: linkedCommunity.id, userId }

    jest.spyOn(connectionsManagerService['storageService'], 'getIdentity').mockResolvedValue(linkedIdentity)
    jest.spyOn(connectionsManagerService, 'spawnTorHiddenService').mockResolvedValue('localhost.onion')
    const libp2pCreateSpy = jest
      .spyOn(connectionsManagerService.libp2pService, 'createInstance')
      .mockResolvedValue(undefined as any)
    jest.spyOn(connectionsManagerService['tor'], 'isBootstrappingFinished').mockResolvedValue(false)
    connectionsManagerService['ports'] = {
      socksPort: 9001,
      libp2pHiddenService: 9002,
      controlPort: 9003,
      dataServer: 9004,
      httpTunnelPort: 9005,
    }
    const storageInitSpy = jest.spyOn(connectionsManagerService['storageService'], 'init').mockResolvedValue()
    jest.spyOn(sigChainService, 'getActiveChain').mockReturnValue(pendingChain as any)
    const existingLifecycle = new CommunityLifecycle(community.id, {} as any)
    connectionsManagerService['communityLifecycle'] = existingLifecycle
    jest.spyOn(admissionCoordinator, 'start').mockImplementation(() => {
      throw new Error('Invitation was not accepted')
    })

    await expect(connectionsManagerService.launch(linkedCommunity)).rejects.toThrow('Invitation was not accepted')
    expect(connectionsManagerService['communityLifecycle']).toBe(existingLifecycle)
    expect(libp2pCreateSpy).not.toHaveBeenCalled()
    expect(storageInitSpy).not.toHaveBeenCalled()
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
    jest.spyOn(connectionsManagerService as any, 'launchCommunityLocked').mockResolvedValue(undefined)
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

    const response = await connectionsManagerService.joinCommunity({
      id: community.id,
      name: community.name!,
      username: 'john',
      inviteData: validInvitationDatav4[0],
    })

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(getNetworkInfoSpy).toHaveBeenCalledTimes(1)
    expect(response?.identity.introMessageSent).toBeUndefined()
    expect(eraseArtifactsSpy.mock.invocationCallOrder[0]).toBeLessThan(getNetworkInfoSpy.mock.invocationCallOrder[0])
  })

  it('recovers a persisted pending-member snapshot when startup cannot load it as an admitted chain', async () => {
    const emitSpy = jest.spyOn(serverIoProvider.io, 'emit')
    // Nest initializes SocketService first, so the first START can precede
    // ConnectionsManagerService attaching its ordinary socket listeners.
    connectionsManagerService['socketService'].emit(SocketActions.START)
    const inviteData = validInvitationDatav4[0]
    const teamId = inviteData.authData.teamId
    await sigChainService.createChainFromInvite({ seed: inviteData.authData.seed, name: 'reopenpeer' }, teamId, true)
    const storedPendingChain = await localDbService.getSigChain(teamId)
    expect(storedPendingChain).toMatchObject({
      serializedTeam: undefined,
      teamKeyRing: undefined,
      pendingMemberAdmission: true,
    })

    const pendingCommunity: Community = {
      ...community,
      id: 'pending-reopen-community',
      name: inviteData.authData.communityName,
      teamId,
      inviteData,
    }
    await localDbService.setCommunity(pendingCommunity)
    await localDbService.setCurrentCommunityId(pendingCommunity.id)
    await sigChainService.deleteChain(teamId, false)
    await expect(sigChainService.loadChain(teamId, true, pendingCommunity.name)).rejects.toThrow(
      'missing serialized team'
    )

    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)
    jest.spyOn(qssService, 'resume').mockResolvedValue()

    await connectionsManagerService.launchCommunityFromStorage()

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(connectionsManagerService['readAdmissionResetReceipt']()).toEqual({
      id: pendingCommunity.id,
      invitationType: 'community',
      phase: 'complete',
    })
    expect(emitSpy).toHaveBeenCalledWith(SocketEvents.ADMISSION_RESET_COMPLETE, {
      id: pendingCommunity.id,
      invitationType: 'community',
    })
  })

  it('creates a non-persisted pending device context and provisional identity when linking a device', async () => {
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)
    jest.spyOn(connectionsManagerService, 'getNetworkInfo').mockResolvedValue(userIdentity.networkInfo)
    jest.spyOn(connectionsManagerService['storageService'], 'setIdentity').mockResolvedValue()
    const deferUserProfileSpy = jest.spyOn(connectionsManagerService['storageService'], 'deferUserProfile')
    const saveChainSpy = jest.spyOn(sigChainService, 'saveChain').mockResolvedValue()

    const response = await connectionsManagerService.linkDevice({
      id: community.id,
      inviteData: deviceInvitationData,
      deviceName: 'Alice’s phone',
      deviceLinkConsent: true,
      confirmedQssEndpoint: deviceInvitationData.qssEndpoint,
    })

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(response?.identity.userId).toBe(deviceInvitationData.authData.userId)
    expect(response?.identity.introMessageSent).toBe(true)
    expect(response?.community.teamId).toBe(deviceInvitationData.authData.teamId)
    expect(response?.community.inviteData).toEqual(deviceInvitationData)
    expect(response?.community.qssSetup).toBe(true)
    expect(sigChainService.activeChain.isPendingDeviceAdmission).toBe(true)
    expect(sigChainService.activeChain.device).not.toHaveProperty('userId')
    expect(sigChainService.activeChain.device.deviceName).toBe('Alice’s phone')
    expect(saveChainSpy).not.toHaveBeenCalled()
    expect(deferUserProfileSpy).not.toHaveBeenCalled()
  })

  it.each([
    { deviceLinkConsent: undefined, confirmedQssEndpoint: deviceInvitationData.qssEndpoint },
    { deviceLinkConsent: true, confirmedQssEndpoint: 'https://different-qss.example.test' },
  ])('rejects device linking unless consent and the QSS endpoint match', async unsafePayload => {
    const inviteData = {
      ...deviceInvitationData,
      qssEnabled: true,
      qssEndpoint: 'https://confirmed-qss.example.test',
    }
    const eraseArtifactsSpy = jest.spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
    const createChainSpy = jest.spyOn(sigChainService, 'createChainFromDeviceInvite')
    const setIdentitySpy = jest.spyOn(connectionsManagerService['storageService'], 'setIdentity')
    const qssConnectSpy = jest.spyOn(qssService, 'connect')

    const response = await connectionsManagerService.linkDevice({
      id: community.id,
      inviteData,
      ...unsafePayload,
    } as any)

    expect(response).toBeUndefined()
    expect(eraseArtifactsSpy).not.toHaveBeenCalled()
    expect(createChainSpy).not.toHaveBeenCalled()
    expect(setIdentitySpy).not.toHaveBeenCalled()
    expect(qssConnectSpy).not.toHaveBeenCalled()
  })

  it('serializes overlapping join and link requests so only the first provisional identity survives', async () => {
    let finishNetwork!: (identity: Identity['networkInfo']) => void
    const heldNetwork = new Promise<Identity['networkInfo']>(resolve => {
      finishNetwork = resolve
    })
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)
    const getNetworkInfoSpy = jest.spyOn(connectionsManagerService, 'getNetworkInfo').mockReturnValue(heldNetwork)

    const first = connectionsManagerService.linkDevice({
      id: 'linked-community',
      inviteData: deviceInvitationData,
      deviceName: 'Linked device',
      deviceLinkConsent: true,
      confirmedQssEndpoint: deviceInvitationData.qssEndpoint,
    })
    await waitForExpect(() => expect(getNetworkInfoSpy).toHaveBeenCalledTimes(1))

    const overlapping = connectionsManagerService.joinCommunity({
      id: 'joined-community',
      name: 'Joined community',
      username: 'alice',
      inviteData: validInvitationDatav4[0],
    })
    await Promise.resolve()
    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)

    finishNetwork(userIdentity.networkInfo)
    await expect(first).resolves.toMatchObject({ id: 'linked-community' })
    await expect(overlapping).resolves.toBeUndefined()
    expect(Object.keys(await localDbService.getCommunities())).toEqual(['linked-community'])
    expect(Object.keys((await localDbService.getIdentities()) ?? {})).toEqual(['linked-community'])
    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
  })

  it('holds a fresh device link behind provisional reset cleanup', async () => {
    const teamId = deviceInvitationData.authData.teamId
    await sigChainService.createChainFromDeviceInvite(
      {
        seed: deviceInvitationData.authData.seed,
        userName: deviceInvitationData.authData.userName,
        expectedTeamId: teamId,
        expectedUserId: deviceInvitationData.authData.userId,
      },
      teamId,
      true
    )
    await localDbService.setCommunity({
      ...community,
      id: 'failed-community',
      teamId,
      inviteData: deviceInvitationData,
    })
    await localDbService.setIdentity({ ...userIdentity, communityId: 'failed-community' })
    connectionsManagerService['timedOutAdmissionCommunityId'] = 'failed-community'
    connectionsManagerService['communityState'] = ServiceState.DEFAULT

    let finishDrain!: () => void
    const drain = jest.fn(
      () =>
        new Promise<void>(resolve => {
          finishDrain = resolve
        })
    )
    connectionsManagerService['communityLifecycle'] = { drain } as any
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockImplementation(async () => {
        await sigChainService.deleteChain(teamId, false)
        await localDbService.purge()
      })
    const getNetworkInfoSpy = jest
      .spyOn(connectionsManagerService, 'getNetworkInfo')
      .mockResolvedValue(userIdentity.networkInfo)

    const reset = connectionsManagerService.resetAdmission('failed-community')
    await waitForExpect(() => expect(drain).toHaveBeenCalledTimes(1))
    const freshLink = connectionsManagerService.linkDevice({
      id: 'fresh-community',
      inviteData: deviceInvitationData,
      deviceName: 'Fresh device',
      deviceLinkConsent: true,
      confirmedQssEndpoint: deviceInvitationData.qssEndpoint,
    })
    await Promise.resolve()
    expect(getNetworkInfoSpy).not.toHaveBeenCalled()

    finishDrain()
    await expect(reset).resolves.toBe(true)
    await expect(freshLink).resolves.toMatchObject({ id: 'fresh-community' })
    expect(Object.keys(await localDbService.getCommunities())).toEqual(['fresh-community'])
    expect(Object.keys((await localDbService.getIdentities()) ?? {})).toEqual(['fresh-community'])

    const eraseCountAfterFreshLink = eraseArtifactsSpy.mock.calls.length
    await expect(connectionsManagerService.resetAdmission('failed-community')).resolves.toBe(true)
    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(eraseCountAfterFreshLink)
    expect(Object.keys(await localDbService.getCommunities())).toEqual(['fresh-community'])
    expect(Object.keys((await localDbService.getIdentities()) ?? {})).toEqual(['fresh-community'])
  })

  it('clears an invalid provisional device admission before accepting a fresh link', async () => {
    jest.spyOn(connectionsManagerService, 'getNetworkInfo').mockResolvedValue(userIdentity.networkInfo)
    const first = await connectionsManagerService.linkDevice({
      id: 'invalid-community',
      inviteData: deviceInvitationData,
      deviceName: 'Rejected device',
      deviceLinkConsent: true,
      confirmedQssEndpoint: deviceInvitationData.qssEndpoint,
    })
    expect(first).toBeDefined()

    const teamId = deviceInvitationData.authData.teamId
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockImplementation(async () => {
        await sigChainService.deleteChain(teamId, false)
        await localDbService.purge()
      })
    jest
      .spyOn(connectionsManagerService, 'launch')
      .mockRejectedValue(new AdmissionError('protocol', 'INVITATION_PROOF_INVALID'))
    jest.spyOn(qssService, 'resume').mockResolvedValue()

    await connectionsManagerService.launchCommunity('invalid-community')

    expect(eraseArtifactsSpy).toHaveBeenCalledTimes(1)
    expect(await localDbService.getCommunity('invalid-community')).toBeUndefined()
    expect(await localDbService.getIdentity('invalid-community')).toBeUndefined()

    const fresh = await connectionsManagerService.linkDevice({
      id: 'fresh-community',
      inviteData: deviceInvitationData,
      deviceName: 'Fresh device',
      deviceLinkConsent: true,
      confirmedQssEndpoint: deviceInvitationData.qssEndpoint,
    })

    expect(fresh).toMatchObject({ id: 'fresh-community' })
    expect(Object.keys(await localDbService.getCommunities())).toEqual(['fresh-community'])
    expect(Object.keys((await localDbService.getIdentities()) ?? {})).toEqual(['fresh-community'])
  })

  it('rejects device linking without erasing an existing community', async () => {
    await localDbService.setCommunity(community)
    const eraseArtifactsSpy = jest
      .spyOn(connectionsManagerService as any, 'erasePreviousCommunityArtifacts')
      .mockResolvedValue(undefined)

    const response = await connectionsManagerService.linkDevice({
      id: 'new-community-id',
      inviteData: deviceInvitationData,
      deviceLinkConsent: true,
      confirmedQssEndpoint: deviceInvitationData.qssEndpoint,
    })

    expect(response).toBeUndefined()
    expect(eraseArtifactsSpy).not.toHaveBeenCalled()
    expect(await localDbService.getCommunity(community.id)).toEqual(community)
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
      const launchCommunitySpy = jest
        .spyOn(connectionsManagerService as any, 'launchCommunityLocked')
        .mockResolvedValue(undefined)
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

  it('creates and persists a 30-minute device invitation through the socket listener', async () => {
    await connectionsManagerService.init()
    const activeChain = await sigChainService.loadChain(chain.teamId!, true)
    const saveChainSpy = jest.spyOn(sigChainService, 'saveChain')
    const callback = jest.fn()
    const beforeCreation = Date.now()

    connectionsManagerService['socketService'].emit(SocketActions.CREATE_DEVICE_LINK, {}, callback)
    await waitForExpect(() => expect(callback).toHaveBeenCalledTimes(1))

    const deviceInvite = callback.mock.calls[0][0] as DeviceLinkInvite
    expect(deviceInvite).toMatchObject({
      userId: activeChain.user.userId,
      userName: activeChain.user.userName,
    })
    expect(deviceInvite.expiresAt).toBeGreaterThanOrEqual(beforeCreation + 30 * 60 * 1000)
    expect(deviceInvite.expiresAt).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000)
    expect(activeChain.invites.getById(deviceInvite.id)).toMatchObject({
      expiration: deviceInvite.expiresAt,
    })
    expect(saveChainSpy).toHaveBeenCalledWith(chain.teamId)
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
              userId: chain.user.userId,
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
              userId: chain.user.userId,
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
                userId: chain.user.userId,
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
