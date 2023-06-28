import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { StorageModule } from './storage.module'
import { StorageService } from './storage.service'

describe('StorageService', () => {
  let module: TestingModule
  let storageService: StorageService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule],
    }).compile()

    storageService = await module.resolve(StorageService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(storageService).toBeDefined()
  })
})
