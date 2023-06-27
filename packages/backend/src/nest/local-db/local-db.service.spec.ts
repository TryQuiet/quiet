import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { LocalDbModule } from './local-db.module'
import { LocalDbService } from './local-db.service'

describe('LocalDbService', () => {
  let module: TestingModule
  let localDbService: LocalDbService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, LocalDbModule],
    }).compile()

    localDbService = await module.resolve(LocalDbService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(localDbService).toBeDefined()
  })
})
