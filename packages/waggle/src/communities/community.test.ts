import CommunitiesManager from './manager'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { createMinConnectionManager, createTmpDir, tmpZbayDirPath } from '../testUtils'
import PeerId from 'peer-id'
import { getPorts } from '../utils'
import { createCertificatesTestHelper } from '../libp2p/tests/client-server'
jest.setTimeout(100_000)

describe('Community manager', () => {
  let connectionsManager: ConnectionsManager
  let manager: CommunitiesManager

  beforeEach(async () => {
    const appDataPath = createTmpDir()
    const ports = await getPorts()
    connectionsManager = createMinConnectionManager({
      env: { appDataPath: tmpZbayDirPath(appDataPath.name) },
      torControlPort: ports.controlPort
    })
    await connectionsManager.init()
  })

  afterEach(async () => {
    manager && await manager.closeStorages()
    await connectionsManager.tor.kill()
  })

  it('creates new community', async () => {
    manager = new CommunitiesManager(connectionsManager)
    expect(manager.communities.size).toBe(0)
    const pems = await createCertificatesTestHelper('address1.onion', 'address2.onion')
    const certs = {
      cert: pems.userCert,
      key: pems.userKey,
      ca: [pems.ca]
    }
    const communityData = await manager.create(certs)
    expect(manager.communities.size).toBe(1)
    expect(manager.communities.has(communityData.peerId.id)).toBeTruthy()
  })

  it('launches community', async () => {
    manager = new CommunitiesManager(connectionsManager)
    expect(manager.communities.size).toBe(0)
    const peerId = await PeerId.create()
    const pems = await createCertificatesTestHelper('address1.onion', 'address2.onion')
    const certs = {
      cert: pems.userCert,
      key: pems.userKey,
      ca: [pems.ca]
    }
    const localAddress = await manager.launch(
      peerId.toJSON(),
      'ED25519-V3:YKbZb2pGbMt44qunoxvrxCKenRomAI9b/HkPB5mWgU9wIm7wqS+43t0yLiCmjSu+FW4f9qFW91c4r6BAsXS9Lg==',
      ['peeraddress'],
      certs
    )
    expect(localAddress).toContain(peerId.toB58String())
    expect(manager.communities.size).toBe(1)
  })
})
