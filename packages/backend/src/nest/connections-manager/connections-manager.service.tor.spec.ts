import PeerId from 'peer-id'
import { type DirResult } from 'tmp'
import crypto from 'crypto'
import { CustomEvent } from '@libp2p/interfaces/events'
import { jest, beforeEach, describe, it, expect, afterEach } from '@jest/globals'
import { communities, getFactory, identity, prepareStore, Store } from '@quiet/state-manager'
import {
  createPeerId,
  createTmpDir,
  generateLibp2pPSK,
  libp2pInstanceParams,
  removeFilesFromDir,
  tmpQuietDirPath,
} from '../common/utils'

import { NetworkStats, type Community, type Identity, type InitCommunityPayload } from '@quiet/types'
import { LazyModuleLoader } from '@nestjs/core'
import { TestingModule, Test } from '@nestjs/testing'
import { FactoryGirl } from 'factory-girl'
import { TestModule } from '../common/test.module'
import { TOR_PASSWORD_PROVIDER, QUIET_DIR } from '../const'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { RegistrationModule } from '../registration/registration.module'
import { RegistrationService } from '../registration/registration.service'
import { SocketModule } from '../socket/socket.module'
import { WebSockets } from '../websocketOverTor'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { TorModule } from '../tor/tor.module'
import { Tor } from '../tor/tor.service'
import { TorControl } from '../tor/tor-control.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { DateTime } from 'luxon'
import waitForExpect from 'wait-for-expect'
import { Libp2pEvents } from '../libp2p/libp2p.types'
import { sleep } from '../common/sleep'
import { createLibp2pAddress } from '@quiet/common'

jest.setTimeout(100_000)

let tmpDir: DirResult
let tmpAppDataPath: string

let module: TestingModule
let connectionsManagerService: ConnectionsManagerService
let tor: Tor
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
let torControl: TorControl

beforeEach(async () => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
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
    imports: [
      TestModule,
      ConnectionsManagerModule,
      LocalDbModule,
      RegistrationModule,
      SocketModule,
      Libp2pModule,
      TorModule,
    ],
  })
    .overrideProvider(TOR_PASSWORD_PROVIDER)
    .useValue({ torPassword: '', torHashedPassword: '' })
    .compile()

  connectionsManagerService = await module.resolve(ConnectionsManagerService)
  localDbService = await module.resolve(LocalDbService)
  registrationService = await module.resolve(RegistrationService)
  tor = await module.resolve(Tor)
  await tor.init()

  const torPassword = crypto.randomBytes(16).toString('hex')
  torControl = await module.resolve(TorControl)
  torControl.authString = 'AUTHENTICATE ' + torPassword + '\r\n'

  lazyModuleLoader = await module.resolve(LazyModuleLoader)
  const { Libp2pModule: Module } = await import('../libp2p/libp2p.module')
  const moduleRef = await lazyModuleLoader.load(() => Module)
  const { Libp2pService } = await import('../libp2p/libp2p.service')
  libp2pService = moduleRef.get(Libp2pService)
  const params = await libp2pInstanceParams()
  peerId = params.peerId

  connectionsManagerService.libp2pService = libp2pService

  quietDir = await module.resolve(QUIET_DIR)

  const libp2pPSK = new Uint8Array(95)
  const psk = generateLibp2pPSK(libp2pPSK)
  const pskBase64 = psk.toString('base64')
  await localDbService.put(LocalDBKeys.PSK, pskBase64)
})

afterEach(async () => {
  await libp2pService?.libp2pInstance?.stop()
  if (connectionsManagerService) {
    await connectionsManagerService.closeAllServices()
  }
  removeFilesFromDir(quietDir)
})

describe('Connections manager', () => {
  it('saves peer stats when peer has been disconnected', async () => {
    class RemotePeerEventDetail {
      peerId: string

      constructor(peerId: string) {
        this.peerId = peerId
      }

      toString = () => {
        return this.peerId
      }
    }
    const emitSpy = jest.spyOn(libp2pService, 'emit')

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: userIdentity.peerId,
      hiddenService: userIdentity.hiddenService,
      certs: {
        // @ts-expect-error
        certificate: userIdentity.userCertificate,
        // @ts-expect-error
        key: userIdentity.userCsr?.userKey,
        CA: [communityRootCa],
      },
      peers: community.peerList,
    }

    await localDbService.put(LocalDBKeys.COMMUNITY, launchCommunityPayload)

    // Peer connected
    await connectionsManagerService.init()
    libp2pService.connectedPeers.set(peerId.toString(), DateTime.utc().valueOf())

    // Peer disconnected
    const remoteAddr = `${peerId.toString()}`
    const peerDisconectEventDetail = {
      remotePeer: new RemotePeerEventDetail(peerId.toString()),
      remoteAddr: new RemotePeerEventDetail(remoteAddr),
    }
    libp2pService.libp2pInstance?.dispatchEvent(
      new CustomEvent('peer:disconnect', { detail: peerDisconectEventDetail })
    )

    expect(libp2pService.connectedPeers.size).toEqual(0)
    await waitForExpect(async () => {
      expect(await localDbService.get(LocalDBKeys.PEERS)).not.toBeNull()
    }, 2000)
    const peerStats: Record<string, NetworkStats> = await localDbService.get(LocalDBKeys.PEERS)
    expect(Object.keys(peerStats)[0]).toEqual(remoteAddr)
    expect(emitSpy).toHaveBeenCalledWith(Libp2pEvents.PEER_DISCONNECTED, {
      peer: peerStats[remoteAddr].peerId,
      connectionDuration: peerStats[remoteAddr].connectionTime,
      lastSeen: peerStats[remoteAddr].lastSeen,
    })
  })

  it('creates network', async () => {
    const spyOnDestroyHiddenService = jest.spyOn(tor, 'destroyHiddenService')
    await connectionsManagerService.init()
    const network = await connectionsManagerService.getNetwork()
    console.log('network', network)
    expect(network.hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
    expect(network.hiddenService.privateKey).toHaveLength(99)
    const peerId = await PeerId.createFromJSON(network.peerId)
    expect(PeerId.isPeerId(peerId)).toBeTruthy()
    expect(await spyOnDestroyHiddenService.mock.results[0].value).toBeTruthy()
  })

  it('dials many peers on start', async () => {
    const store = prepareStore().store
    const factory = await getFactory(store)
    const community = await factory.create<Community>('Community', { rootCa: 'rootCa' })
    const userIdentity = await factory.create<Identity>('Identity', { id: community.id, nickname: 'john' })
    const spyOnDial = jest.spyOn(WebSockets.prototype, 'dial')

    const peerList: string[] = []
    const peersCount = 7
    for (let pCount = 0; pCount < peersCount; pCount++) {
      console.log('pushing peer ', pCount)
      peerList.push(
        createLibp2pAddress(`${Math.random().toString(36).substring(2, 13)}.onion`, (await createPeerId()).toString())
      )
    }

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: userIdentity.peerId,
      hiddenService: userIdentity.hiddenService,
      certs: {
        // @ts-expect-error Identity.userCertificate can be null
        certificate: userIdentity.userCertificate,
        // @ts-expect-error Identity.userCertificate userCsr.userKey can be undefined
        key: userIdentity.userCsr?.userKey,
        // @ts-expect-error
        CA: [community.rootCa],
      },
      peers: peerList,
    }
    await connectionsManagerService.init()
    await connectionsManagerService.launchCommunity(launchCommunityPayload)
    await sleep(5000)
    expect(spyOnDial).toHaveBeenCalledTimes(peersCount)
    // Temporary fix for hanging test - websocketOverTor doesn't have abortController
    await sleep(5000)
  })

  it.skip('Bug reproduction - iOS app crashing because lack of data server', async () => {
    const store = prepareStore().store
    const factory = await getFactory(store)
    const community = await factory.create<Community>('Community', { rootCa: 'rootCa' })
    const userIdentity = await factory.create<Identity>('Identity', { id: community.id, nickname: 'john' })

    await connectionsManagerService.init()
    const spyOnDial = jest.spyOn(WebSockets.prototype, 'dial')

    const peerList: string[] = []
    const peersCount = 8
    for (let pCount = 0; pCount < peersCount; pCount++) {
      peerList.push(
        createLibp2pAddress(`${Math.random().toString(36).substring(2, 13)}.onion`, (await createPeerId()).toString())
      )
    }

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: userIdentity.peerId,
      hiddenService: userIdentity.hiddenService,
      certs: {
        // @ts-expect-error Identity.userCertificate can be null
        certificate: userIdentity.userCertificate,
        // @ts-expect-error
        key: userIdentity.userCsr?.userKey,
        // @ts-expect-error
        CA: [community.rootCa],
      },
      peers: peerList,
    }

    await connectionsManagerService.launchCommunity(launchCommunityPayload)
    expect(spyOnDial).toHaveBeenCalledTimes(peersCount)
    await connectionsManagerService.closeAllServices()
    await sleep(5000)

    const launchSpy = jest.spyOn(connectionsManagerService, 'launch')
    await connectionsManagerService.init()
    expect(launchSpy).toBeCalledTimes(1)
    // Temporary fix for hanging test - websocketOverTor doesn't have abortController
    await sleep(5000)
  })
})
