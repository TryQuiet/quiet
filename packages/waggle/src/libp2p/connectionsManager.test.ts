import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { createTmpDir, tmpZbayDirPath } from '../common/testUtils'
import * as utils from '../common/utils'
import { ConnectionsManager } from './connectionsManager'

let tmpDir: DirResult
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
  connectionsManager = null
})

describe('Connections manager', () => {
  it('inits only tor control if spawnTor is set to false', async () => {
    const torPassword = 'testTorPassword'
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
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

  it('throws error when tries to send certification request to the offline registrar', async () => {
    const ports = await utils.getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      httpTunnelPort: ports.httpTunnelPort,
      io: new utils.DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort
      }
    })
    await expect(
      connectionsManager.sendCertificateRegistrationRequest(
        'http://invalid.onion',
        'cert'
      )
    ).rejects.toThrow()
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
    const result = await connectionsManager.initLibp2p({
      peerId: peerId,
      address: address,
      addressPort: port,
      targetPort: port,
      bootstrapMultiaddrs: ['some/address'],
      certs: null
    })
    expect(result.localAddress).toBe(localAddress)
    expect(result.libp2p.peerId).toBe(peerId)
    console.log(result.libp2p.addresses.listen)
    expect(result.libp2p.addresses.listen).toStrictEqual([listenAddress])
  })

  it.each([['ws'], ['wss']])(
    'creates libp2p address with proper ws type (%s)',
    async (wsType: 'ws' | 'wss') => {
      const address = '0.0.0.0'
      const port = 1234
      const peerId = await PeerId.create()
      const ports = await utils.getPorts()
      connectionsManager = new ConnectionsManager({
        agentHost: 'localhost',
        agentPort: ports.socksPort,
        httpTunnelPort: ports.httpTunnelPort,
        io: new utils.DummyIOServer(),
        options: {
          env: {
            appDataPath: tmpAppDataPath
          },
          torControlPort: ports.controlPort,
          wsType
        }
      })
      const libp2pAddress = connectionsManager.createLibp2pAddress(
        address,
        port,
        peerId.toB58String()
      )
      expect(libp2pAddress).toStrictEqual(
        `/dns4/${address}/tcp/${port}/${wsType}/p2p/${peerId.toB58String()}`
      )
    }
  )

  it.each([['ws'], ['wss']])(
    'creates libp2p listen address with proper ws type (%s)',
    async (wsType: 'ws' | 'wss') => {
      const address = '0.0.0.0'
      const port = 1234
      const ports = await utils.getPorts()
      connectionsManager = new ConnectionsManager({
        agentHost: 'localhost',
        agentPort: ports.socksPort,
        httpTunnelPort: ports.httpTunnelPort,
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
    }
  )
})
