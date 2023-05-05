import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { createPeerId, createTmpDir, tmpQuietDirPath } from '../common/testUtils'
import { ConnectionsManager } from './connectionsManager'
import { jest, beforeEach, describe, it, expect, afterEach } from '@jest/globals'
import { communities, getFactory, identity, InitCommunityPayload, prepareStore } from '@quiet/state-manager'
import { createLibp2pAddress } from '../common/utils'
import { WebSockets } from './websocketOverTor'
import { initConnectionsManagerWithTor } from './utils'

const { getPorts } = await import('../common/utils')

jest.setTimeout(100_000)

let tmpDir: DirResult
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager | null

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  connectionsManager = null
})

afterEach(async () => {
  if (connectionsManager) {
    await connectionsManager.closeAllServices()
  }
})

describe('Connections manager', () => {
  it('runs tor by default', async () => {
    const ports = await getPorts()
    connectionsManager = new ConnectionsManager({
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })

    const socket = await initConnectionsManagerWithTor(connectionsManager, ports.socksPort)
    expect(connectionsManager.tor.process).not.toBeNull()
    socket.close()
  })

  it('creates network', async () => {
    const ports = await getPorts()
    connectionsManager = new ConnectionsManager({
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    const socket = await initConnectionsManagerWithTor(connectionsManager, ports.socksPort)
    const spyOnDestroyHiddenService = jest.spyOn(connectionsManager.tor, 'destroyHiddenService')
    const network = await connectionsManager.getNetwork()
    expect(network.hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
    expect(network.hiddenService.privateKey).toHaveLength(99)
    const peerId = await PeerId.createFromJSON(network.peerId)
    expect(PeerId.isPeerId(peerId)).toBeTruthy()
    expect(await spyOnDestroyHiddenService.mock.results[0].value).toBeTruthy()
    socket.close()
  })

  it('dials many peers on start', async () => {
    const store = prepareStore().store
    const factory = await getFactory(store)
    const community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')
    const userIdentity = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity', { id: community.id, nickname: 'john' }
    )
    const ports = await getPorts()

    connectionsManager = new ConnectionsManager({
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    const socket = await initConnectionsManagerWithTor(connectionsManager, ports.socksPort)
    const spyOnDial = jest.spyOn(WebSockets.prototype, 'dial')

    const peerList: string[] = []
    const peersCount = 11
    for (let pCount = 0; pCount < peersCount; pCount++) {
      peerList.push(createLibp2pAddress(`${Math.random().toString(36).substring(2, 13)}.onion`, (await createPeerId()).toString()))
    }

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: userIdentity.peerId,
      hiddenService: userIdentity.hiddenService,
      certs: {
        certificate: userIdentity.userCertificate!,
        key: userIdentity.userCsr?.userKey!,
        CA: [community.rootCa]
      },
      peers: peerList
    }

    await connectionsManager.launchCommunity(launchCommunityPayload)
    expect(spyOnDial).toHaveBeenCalledTimes(peersCount)
    socket.close()
  })

  it('Bug reproduction - iOS app crashing because lack of data server', async () => {
    const store = prepareStore().store
    const factory = await getFactory(store)
    const community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')
    const userIdentity = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity', { id: community.id, nickname: 'john' }
    )
    const ports = await getPorts()

    connectionsManager = new ConnectionsManager({
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    const socket = await initConnectionsManagerWithTor(connectionsManager, ports.socksPort)
    const spyOnDial = jest.spyOn(WebSockets.prototype, 'dial')

    const peerList: string[] = []
    const peersCount = 11
    for (let pCount = 0; pCount < peersCount; pCount++) {
      peerList.push(createLibp2pAddress(`${Math.random().toString(36).substring(2, 13)}.onion`, (await createPeerId()).toString()))
    }

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: userIdentity.peerId,
      hiddenService: userIdentity.hiddenService,
      certs: {
        certificate: userIdentity.userCertificate!,
        key: userIdentity.userCsr?.userKey!,
        CA: [community.rootCa]
      },
      peers: peerList
    }

    await connectionsManager.launchCommunity(launchCommunityPayload)
    expect(spyOnDial).toHaveBeenCalledTimes(peersCount)
    await connectionsManager.closeAllServices()
    socket.close()
    connectionsManager = null

    // IOS

     const connectionsManager2 = new ConnectionsManager({
      torControlPort: 4321,
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    const launchSpy = jest.spyOn(connectionsManager2, 'launch').mockResolvedValue('address')
    await connectionsManager2.init()
    expect(launchSpy).toBeCalledTimes(1)
    await connectionsManager2.closeAllServices()
  })
})
