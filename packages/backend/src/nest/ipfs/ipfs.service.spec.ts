import { LazyModuleLoader } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import PeerId from 'peer-id'
import { TestModule } from '../common/test.module'
import { libp2pInstanceParams } from '../common/utils'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { SocketModule } from '../socket/socket.module'
import { IpfsModule } from './ipfs.module'
import { IpfsService } from './ipfs.service'

describe('IpfsService', () => {
  let module: TestingModule
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let lazyModuleLoader: LazyModuleLoader
  let peerId: PeerId

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, IpfsModule, SocketModule, Libp2pModule],
    }).compile()

    ipfsService = await module.resolve(IpfsService)

    lazyModuleLoader = await module.resolve(LazyModuleLoader)
    const { Libp2pModule: Module } = await import('../libp2p/libp2p.module')
    const moduleRef = await lazyModuleLoader.load(() => Module)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    libp2pService = moduleRef.get(Libp2pService)
    const params = await libp2pInstanceParams()
    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()

    peerId = params.peerId
  })

  afterAll(async () => {
    await libp2pService.libp2pInstance?.stop()
    await ipfsService.ipfsInstance?.stop()
    await module.close()
  })

  it('Create IPFS instance', async () => {
    await ipfsService.createInstance(peerId)
    const ipfsInstance = ipfsService.ipfsInstance
    expect(ipfsInstance).not.toBeNull()
  })

  it('destory instance IPFS', async () => {
    await ipfsService.createInstance(peerId)
    await ipfsService.destoryInstance()
    expect(ipfsService.ipfsInstance).toBeNull()
  })
})
