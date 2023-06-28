import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { TOR_PASSWORD_PROVIDER } from '../const'
import { TorControl } from './tor-control.service'
import { TorModule } from './tor.module'

describe('TorControl', () => {
  let module: TestingModule
  let torControl: TorControl

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, TorModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: '', torHashedPassword: '' })
      .compile()

    torControl = await module.resolve(TorControl)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(torControl).toBeDefined()
  })
})
