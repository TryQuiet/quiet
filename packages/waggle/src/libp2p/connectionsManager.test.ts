import PeerId from 'peer-id'
import { createTmpDir, TmpDir, tmpZbayDirPath } from '../common/testUtils'
import * as utils from '../common/utils'
import { ConnectionsManager } from './connectionsManager'
jest.setTimeout(100_000)

let tmpDir: TmpDir
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
  connectionsManager = null
})

describe('Connections manager', () => {
  it('runs tor by default', async () => {
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort
      }
    })
    await connectionsManager.init()
    expect(connectionsManager.tor.process).not.toBeNull()
    await connectionsManager.tor.kill()
  })

  it('inits only tor control if spawnTor is set to false', async () => {
    const torPassword = 'testTorPassword'
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        spawnTor: false,
        torControlPort: ports.controlPort,
        torPassword
      }
    })
    await connectionsManager.init()
    expect(connectionsManager.tor.process).toBeNull()
    const torControl = connectionsManager.tor.torControl
    expect(torControl.password).toEqual(torPassword)
    expect(torControl.params.port).toEqual(ports.controlPort)
  })

  it('creates network', async() => {
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort
      }
    })
    await connectionsManager.init()
    const spyOnDestroyHiddenService = jest.spyOn(connectionsManager.tor, 'destroyHiddenService')
    const network = await connectionsManager.createNetwork()
    expect(network.hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
    expect(network.hiddenService.privateKey).toHaveLength(99)
    const peerId = await PeerId.createFromJSON(network.peerId)
    expect(PeerId.isPeerId(peerId)).toBeTruthy()
    expect(await spyOnDestroyHiddenService.mock.results[0].value).toBeTruthy()
    await connectionsManager.tor.kill()
  })

  it('tries to send certification request multiple times before giving up', async () => {
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort
      }
    })
    const spyOnFetchRetry = jest.spyOn(utils, 'fetchRetry')
    const retryCount = 3
    await expect(connectionsManager.sendCertificateRegistrationRequest('http://invalid.onion', 'cert', retryCount)).rejects.toThrow()
    expect(spyOnFetchRetry).toHaveBeenCalledTimes(retryCount)
  })

  it('inits libp2p', async () => {
    const peerId = await PeerId.create()
    const port = 1234
    const address = '0.0.0.0'
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort
      }
    })
    const localAddress = connectionsManager.createLibp2pAddress(address, port, peerId.toB58String())
    const listenAddress = connectionsManager.createLibp2pListenAddress(address, port)
    const result = await connectionsManager.initLibp2p(
      peerId,
      address,
      port,
      ['some/address'],
      null,
      port
    )
    expect(result.localAddress).toBe(localAddress)
    expect(result.libp2p.peerId).toBe(peerId)
    console.log(result.libp2p.addresses.listen)
    expect(result.libp2p.addresses.listen).toStrictEqual([listenAddress])
  })

  it.each([
    ['ws'],
    ['wss']
  ])('creates libp2p address with proper ws type (%s)', async (wsType: 'ws' | 'wss') => {
    const address = '0.0.0.0'
    const port = 1234
    const peerId = await PeerId.create()
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort,
        wsType
      }
    })
    const libp2pAddress = connectionsManager.createLibp2pAddress(address, port, peerId.toB58String())
    expect(libp2pAddress).toStrictEqual(`/dns4/${address}/tcp/${port}/${wsType}/p2p/${peerId.toB58String()}`)
  })

  it.each([
    ['ws'],
    ['wss']
  ])('creates libp2p listen address with proper ws type (%s)', async (wsType: 'ws' | 'wss') => {
    const address = '0.0.0.0'
    const port = 1234
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      // @ts-expect-error
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort,
        wsType
      }
    })
    const libp2pListenAddress = connectionsManager.createLibp2pListenAddress(address, port)
    expect(libp2pListenAddress).toStrictEqual(`/dns4/${address}/tcp/${port}/${wsType}`)
  })
})
