import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { libp2pInstanceParams } from '../common/test.utils'
import { Libp2pModule } from './libp2p.module'
import { Libp2pService } from './libp2p.service'

describe('Libp2pService', () => {
  let module: TestingModule
  let libp2pService: Libp2pService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, Libp2pModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', async () => {
    const params = await libp2pInstanceParams()
    const libp2pInstance = await libp2pService.createInstance(params)

    expect(libp2pService).toBeDefined()
  })
  // it('inits libp2p', async () => {
  //   const peerId = await createPeerId()
  //   const port = 1234
  //   const address = '0.0.0.0'

  //   connectionsManager = new ConnectionsManager({
  //     socketIOPort: port,
  //     options: {
  //       env: {
  //         appDataPath: tmpAppDataPath,
  //       },
  //     },
  //   })

  //   connectionsManager.dataServer = new DataServer(port)
  //   connectionsManager.io = connectionsManager.dataServer.io

  //   const localAddress = connectionsManager.createLibp2pAddress(address, peerId.toString())
  //   const remoteAddress = connectionsManager.createLibp2pAddress(address, (await createPeerId()).toString())
  //   const result = await connectionsManager.initLibp2p({
  //     peerId,
  //     address,
  //     addressPort: port,
  //     targetPort: port,
  //     bootstrapMultiaddrs: [remoteAddress],

  //     certs: {
  //       // @ts-expect-error
  //       certificate: userIdentity.userCertificate,
  //       // @ts-expect-error
  //       key: userIdentity.userCsr.userKey,
  //       CA: [communityRootCa],
  //     },
  //   })
  //   expect(result.localAddress).toBe(localAddress)
  //   expect(result.libp2p.peerId).toBe(peerId)
  // })

  // it('creates libp2p address with proper ws type (%s)', async () => {
  //   const address = '0.0.0.0'
  //   const port = 1234
  //   const peerId = await PeerId.create()
  //   connectionsManager = new ConnectionsManager({
  //     socketIOPort: port,
  //     options: {
  //       env: {
  //         appDataPath: tmpAppDataPath,
  //       },
  //     },
  //   })
  //   const libp2pAddress = connectionsManager.createLibp2pAddress(address, peerId.toB58String())
  //   expect(libp2pAddress).toStrictEqual(`/dns4/${address}/tcp/443/wss/p2p/${peerId.toB58String()}`)
  // })

  // it('creates libp2p listen address', async () => {
  //   const address = '0.0.0.0'
  //   const port = 1234
  //   connectionsManager = new ConnectionsManager({
  //     socketIOPort: port,
  //     options: {
  //       env: {
  //         appDataPath: tmpAppDataPath,
  //       },
  //     },
  //   })
  //   const libp2pListenAddress = connectionsManager.createLibp2pListenAddress(address)
  //   expect(libp2pListenAddress).toStrictEqual(`/dns4/${address}/tcp/443/wss`)
  // })
})
