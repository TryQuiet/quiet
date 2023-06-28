import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { TorModule } from './tor.module'
import { Tor } from './tor.service'

describe('TorControl', () => {
  let module: TestingModule
  let torService: Tor

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, TorModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: '', torHashedPassword: '' })
      .overrideProvider(TOR_PARAMS_PROVIDER)
      .useValue({ torPath: '', options: '' })
      .compile()

    torService = await module.resolve(Tor)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(torService).toBeDefined()
  })
})
