import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { RegistrationModule } from './registration.module'
import { RegistrationService } from './registration.service'

describe('RegistrationService', () => {
  let module: TestingModule
  let registrationService: RegistrationService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, RegistrationModule],
    }).compile()

    registrationService = await module.resolve(RegistrationService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(registrationService).toBeDefined()
  })
})
