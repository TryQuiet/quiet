import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { SocketModule } from '../socket/socket.module'
import { IpfsModule } from './ipfs.module'
import { IpfsService } from './ipfs.service'

describe('IpfsService', () => {
  let module: TestingModule
  let ipfsService: IpfsService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, IpfsModule, SocketModule, Libp2pModule],
    }).compile()

    ipfsService = await module.resolve(IpfsService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', async () => {
    console.log('xd')
    expect(ipfsService).toBeDefined()

    // const ipfs = await ipfsService.create('xd')
    // console.log({ ipfs })
  })
})
