import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { createTmpDir, tmpQuietDirPath } from '../common/testUtils'
import { ConnectionsManager } from './connectionsManager'

let tmpDir: DirResult
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  connectionsManager = null
})

describe('Connections manager', () => {
  it('inits libp2p', async () => {
    const peerId = await PeerId.create()
    const port = 1234
    const address = '0.0.0.0'
    connectionsManager = new ConnectionsManager({
      socketIOPort: port,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    const localAddress = connectionsManager.createLibp2pAddress(address, peerId.toB58String())
    const listenAddress = connectionsManager.createLibp2pListenAddress(address)
    const result = await connectionsManager.initLibp2p({
      peerId: peerId,
      address: address,
      addressPort: port,
      targetPort: port,
      bootstrapMultiaddrs: ['some/address'],
      certs: { certificate: 'asdf', key: 'asdf', CA: ['ASDF'] }
    })
    expect(result.localAddress).toBe(localAddress)
    expect(result.libp2p.peerId).toBe(peerId)
    // expect(result.libp2p.addresses.listen).toStrictEqual([listenAddress])
  })

  it(
    'creates libp2p address with proper ws type (%s)',
    async () => {
      const address = '0.0.0.0'
      const port = 1234
      const peerId = await PeerId.create()
      connectionsManager = new ConnectionsManager({
        socketIOPort: port,
        options: {
          env: {
            appDataPath: tmpAppDataPath
          },
        }
      })
      const libp2pAddress = connectionsManager.createLibp2pAddress(
        address,
        peerId.toB58String()
      )
      expect(libp2pAddress).toStrictEqual(
        `/dns4/${address}/tcp/443/wss/p2p/${peerId.toB58String()}`
      )
    }
  )

  it('creates libp2p listen address',
    async () => {
      const address = '0.0.0.0'
      const port = 1234
      connectionsManager = new ConnectionsManager({
        socketIOPort: port,
        options: {
          env: {
            appDataPath: tmpAppDataPath
          },
        }
      })
      const libp2pListenAddress = connectionsManager.createLibp2pListenAddress(address)
      expect(libp2pListenAddress).toStrictEqual(`/dns4/${address}/tcp/443/wss`)
    }
  )
})
