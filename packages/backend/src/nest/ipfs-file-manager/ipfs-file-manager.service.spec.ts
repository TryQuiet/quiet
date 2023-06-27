import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { IpfsFileManagerModule } from './ipfs-file-manager.module'
import { IpfsFileManagerService } from './ipfs-file-manager.service'

describe('IpfsFileManagerService', () => {
  let module: TestingModule
  let ipfsFileManagerService: IpfsFileManagerService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, IpfsFileManagerModule],
    }).compile()

    ipfsFileManagerService = await module.resolve(IpfsFileManagerService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(ipfsFileManagerService).toBeDefined()
  })
})
