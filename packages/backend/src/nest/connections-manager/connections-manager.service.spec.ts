import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { TOR_PASSWORD_PROVIDER } from '../const'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'

describe('ConnectionsManagerService', () => {
  let module: TestingModule
  let connectionsManagerService: ConnectionsManagerService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, ConnectionsManagerModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: '', torHashedPassword: '' })
      .compile()

    connectionsManagerService = await module.resolve(ConnectionsManagerService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(connectionsManagerService).toBeDefined()
  })
})
