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
})
