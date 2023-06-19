import PeerId from 'peer-id'
import { type DirResult } from 'tmp'
import { createPeerId, createTmpDir, tmpQuietDirPath } from '../common/testUtils'
import { ConnectionsManager } from './connectionsManager'
import { jest, beforeEach, describe, it, expect, afterEach } from '@jest/globals'
import { LocalDBKeys } from '../storage/localDB'
import { CustomEvent } from '@libp2p/interfaces/events'
import { type communities, getFactory, prepareStore, type identity, type Store } from '@quiet/state-manager'
import { type FactoryGirl } from 'factory-girl'
import { DateTime } from 'luxon'
import waitForExpect from 'wait-for-expect'
import { Libp2pEvents } from './types'
import { DataServer } from '../socket/DataServer'
import io from 'socket.io-client'
import {
  type Community,
  type Identity,
  type InitCommunityPayload,
  type LaunchRegistrarPayload,
  type NetworkStats,
} from '@quiet/types'

let tmpDir: DirResult
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager | null
let store: Store
let factory: FactoryGirl
let community: Community
let userIdentity: Identity
let communityRootCa: string

beforeEach(async () => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  connectionsManager = null
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
})

afterEach(async () => {
  if (connectionsManager) {
    await connectionsManager.closeAllServices()
  }
})

describe('Connections manager - no tor', () => {
  it('inits libp2p', async () => {
    const peerId = await createPeerId()
    const port = 1234
    const address = '0.0.0.0'

    connectionsManager = new ConnectionsManager({
      socketIOPort: port,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })

    connectionsManager.dataServer = new DataServer(port)
    connectionsManager.io = connectionsManager.dataServer.io

    const localAddress = connectionsManager.createLibp2pAddress(address, peerId.toString())
    const remoteAddress = connectionsManager.createLibp2pAddress(address, (await createPeerId()).toString())
    const result = await connectionsManager.initLibp2p({
      peerId,
      address,
      addressPort: port,
      targetPort: port,
      bootstrapMultiaddrs: [remoteAddress],

      certs: {
        // @ts-expect-error
        certificate: userIdentity.userCertificate,
        // @ts-expect-error
        key: userIdentity.userCsr.userKey,
        CA: [communityRootCa],
      },
    })
    expect(result.localAddress).toBe(localAddress)
    expect(result.libp2p.peerId).toBe(peerId)
  })

  it('creates libp2p address with proper ws type (%s)', async () => {
    const address = '0.0.0.0'
    const port = 1234
    const peerId = await PeerId.create()
    connectionsManager = new ConnectionsManager({
      socketIOPort: port,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })
    const libp2pAddress = connectionsManager.createLibp2pAddress(address, peerId.toB58String())
    expect(libp2pAddress).toStrictEqual(`/dns4/${address}/tcp/443/wss/p2p/${peerId.toB58String()}`)
  })

  it('creates libp2p listen address', async () => {
    const address = '0.0.0.0'
    const port = 1234
    connectionsManager = new ConnectionsManager({
      socketIOPort: port,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })
    const libp2pListenAddress = connectionsManager.createLibp2pListenAddress(address)
    expect(libp2pListenAddress).toStrictEqual(`/dns4/${address}/tcp/443/wss`)
  })

  it('launches community on init if its data exists in local db', async () => {
    connectionsManager = new ConnectionsManager({
      socketIOPort: 1234,
      torControlPort: 4321,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })
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

    await connectionsManager.init()
    await connectionsManager.localStorage.put(LocalDBKeys.COMMUNITY, launchCommunityPayload)
    await connectionsManager.closeAllServices()

    const launchCommunitySpy = jest.spyOn(connectionsManager, 'launchCommunity').mockResolvedValue()
    const launchRegistrarSpy = jest.spyOn(connectionsManager.registration, 'launchRegistrar').mockResolvedValue()

    const url = `http://localhost:${1234}`
    const socket = io(url)

    const init = new Promise<void>(resolve => {
      void connectionsManager?.init()
      socket.connect()
      setTimeout(() => {
        resolve()
      }, 200)
    })

    await init

    expect(launchRegistrarSpy).not.toHaveBeenCalled()
    expect(launchCommunitySpy).toHaveBeenCalledWith(launchCommunityPayload)

    socket.close()
  })

  it('launches community and registrar on init if their data exists in local db', async () => {
    connectionsManager = new ConnectionsManager({
      socketIOPort: 1234,
      torControlPort: 4321,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })

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

    const launchRegistrarPayload: LaunchRegistrarPayload = {
      id: community.id,
      peerId: userIdentity.peerId.id,
      // @ts-expect-error
      rootCertString: community.CA?.rootCertString,
      // @ts-expect-error
      rootKeyString: community.CA?.rootKeyString,
      privateKey: 'privateKey',
    }

    await connectionsManager.init()
    await connectionsManager.localStorage.put(LocalDBKeys.COMMUNITY, launchCommunityPayload)
    await connectionsManager.localStorage.put(LocalDBKeys.REGISTRAR, launchRegistrarPayload)

    const peerAddress = '/dns4/test.onion/tcp/443/wss/p2p/peerid'
    await connectionsManager.localStorage.put(LocalDBKeys.PEERS, {
      [peerAddress]: {
        peerId: 'QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix',
        connectionTime: 50,
        lastSeen: 1000,
      },
    })

    await connectionsManager.closeAllServices()

    const launchCommunitySpy = jest.spyOn(connectionsManager, 'launchCommunity').mockResolvedValue()
    const launchRegistrarSpy = jest.spyOn(connectionsManager.registration, 'launchRegistrar').mockResolvedValue()

    const url = `http://localhost:${1234}`
    const socket = io(url)

    const init = new Promise<void>(resolve => {
      void connectionsManager?.init()
      socket.connect()
      setTimeout(() => {
        resolve()
      }, 200)
    })

    await init

    expect(launchCommunitySpy).toHaveBeenCalledWith(Object.assign(launchCommunityPayload, { peers: [peerAddress] }))
    expect(launchRegistrarSpy).toHaveBeenCalledWith(launchRegistrarPayload)
    socket.close()
  })

  it('does not launch community on init if its data does not exist in local db', async () => {
    connectionsManager = new ConnectionsManager({
      socketIOPort: 1234,
      torControlPort: 4321,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })
    const launchCommunitySpy = jest.spyOn(connectionsManager, 'launchCommunity')
    const launchRegistrarSpy = jest.spyOn(connectionsManager.registration, 'launchRegistrar')
    await connectionsManager.init()
    expect(launchCommunitySpy).not.toHaveBeenCalled()
    expect(launchRegistrarSpy).not.toHaveBeenCalled()
  })

  it('saves peer stats when peer has been disconnected', async () => {
    const peerId = await createPeerId()
    class RemotePeerEventDetail {
      peerId: string

      constructor(peerId: string) {
        this.peerId = peerId
      }

      toString = () => {
        return this.peerId
      }
    }

    connectionsManager = new ConnectionsManager({
      socketIOPort: 1234,
      torControlPort: 4321,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })

    await connectionsManager.init()
    await connectionsManager.initLibp2p({
      peerId,
      address: '0.0.0.0',
      addressPort: 3211,
      targetPort: 3211,
      bootstrapMultiaddrs: ['some/address'],
      certs: {
        // @ts-expect-error
        certificate: userIdentity.userCertificate,
        // @ts-expect-error
        key: userIdentity.userCsr?.userKey,
        CA: [communityRootCa],
      },
    })
    const emitSpy = jest.spyOn(connectionsManager, 'emit')

    // Peer connected
    connectionsManager.connectedPeers.set(peerId.toString(), DateTime.utc().valueOf())

    // Peer disconnected
    const remoteAddr = `test/p2p/${peerId.toString()}`
    const peerDisconectEventDetail = {
      remotePeer: new RemotePeerEventDetail(peerId.toString()),
      remoteAddr: new RemotePeerEventDetail(remoteAddr),
    }
    connectionsManager.libp2pInstance?.dispatchEvent(
      new CustomEvent('peer:disconnect', { detail: peerDisconectEventDetail })
    )
    expect(connectionsManager.connectedPeers.size).toEqual(0)
    await waitForExpect(async () => {
      expect(await connectionsManager?.localStorage.get(LocalDBKeys.PEERS)).not.toBeNull()
    }, 2000)
    const peerStats: Record<string, NetworkStats> = await connectionsManager.localStorage.get(LocalDBKeys.PEERS)
    expect(Object.keys(peerStats)[0]).toEqual(remoteAddr)
    expect(emitSpy).toHaveBeenCalledWith(Libp2pEvents.PEER_DISCONNECTED, {
      peer: peerStats[remoteAddr].peerId,
      connectionDuration: peerStats[remoteAddr].connectionTime,
      lastSeen: peerStats[remoteAddr].lastSeen,
    })
  })
  // At this moment, that test have to be skipped, because checking statues is called before launchCommunity method
  it.skip('community is only launched once', async () => {
    connectionsManager = new ConnectionsManager({
      socketIOPort: 1234,
      torControlPort: 4321,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })
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

    const launchSpy = jest.spyOn(connectionsManager, 'launch').mockResolvedValue('address')

    await connectionsManager.init()

    await Promise.all([
      connectionsManager.launchCommunity(launchCommunityPayload),
      connectionsManager.launchCommunity(launchCommunityPayload),
    ])

    expect(launchSpy).toBeCalledTimes(1)
  })

  it('Bug reproduction - Error on startup - Error: TOR: Connection already established - Trigger launchCommunity and launchRegistrar from backend and state manager', async () => {
    connectionsManager = new ConnectionsManager({
      socketIOPort: 1234,
      torControlPort: 4321,
      options: {
        env: {
          appDataPath: tmpAppDataPath,
        },
      },
    })

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

    const launchRegistrarPayload: LaunchRegistrarPayload = {
      id: community.id,
      peerId: userIdentity.peerId.id,
      // @ts-expect-error
      rootCertString: community.CA?.rootCertString,
      // @ts-expect-error
      rootKeyString: community.CA?.rootKeyString,
      privateKey: '',
    }

    await connectionsManager.init()
    await connectionsManager.localStorage.put(LocalDBKeys.COMMUNITY, launchCommunityPayload)
    await connectionsManager.localStorage.put(LocalDBKeys.REGISTRAR, launchRegistrarPayload)

    const peerAddress = '/dns4/test.onion/tcp/443/wss/p2p/peerid'
    await connectionsManager.localStorage.put(LocalDBKeys.PEERS, {
      [peerAddress]: {
        peerId: 'QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix',
        connectionTime: 50,
        lastSeen: 1000,
      },
    })

    await connectionsManager.closeAllServices()

    const launchCommunitySpy = jest.spyOn(connectionsManager, 'launchCommunity').mockResolvedValue()
    const launchRegistrarSpy = jest.spyOn(connectionsManager.registration, 'launchRegistrar').mockResolvedValue()

    const url = `http://localhost:${1234}`
    const socket = io(url)

    const init = new Promise<void>(resolve => {
      void connectionsManager?.init()
      socket.connect()
      setTimeout(() => {
        resolve()
      }, 200)
    })

    await init

    expect(launchCommunitySpy).toBeCalledTimes(1)
    expect(launchRegistrarSpy).toBeCalledTimes(1)

    socket.close()
  })
})
