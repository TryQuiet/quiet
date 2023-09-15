import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { SocketModule } from './socket.module'
import { SocketService } from './socket.service'

describe('SocketService', () => {
  let module: TestingModule
  let socketService: SocketService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SocketModule],
    }).compile()

    socketService = await module.resolve(SocketService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    await socketService.listen()
  })

  afterEach(async () => {
    await socketService.close()
  })

  it('sets no default cors', async () => {
    expect(socketService.serverIoProvider.io.engine.opts.cors).toStrictEqual({}) // No cors should be set by default
  })
})
