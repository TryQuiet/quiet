import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { SocketModule } from './socket.module'
import { SocketService } from './socket.service'
import { io, Socket } from 'socket.io-client'
import waitForExpect from 'wait-for-expect'
import { suspendableSocketEvents } from './suspendable.events'
import { TEST_DATA_PORT } from '../const'

describe('SocketService', () => {
  let module: TestingModule
  let socketService: SocketService

  let client: Socket

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SocketModule],
    }).compile()

    socketService = await module.resolve(SocketService)

    module.init()

    client = io(`http://localhost:${TEST_DATA_PORT}`)
  })

  afterAll(async () => {
    client.close()
    socketService.close()

    await module.close()
  })

  it('sets no default cors', async () => {
    expect(socketService.serverIoProvider.io.engine.opts.cors).toStrictEqual({}) // No cors should be set by default
  })

  it('suspends events handling until backend is fully initialized', async () => {
    const spy = jest.spyOn(socketService, 'emit')

    const event = suspendableSocketEvents[0]

    client.emit(event)

    expect(spy).not.toBeCalledWith(event, undefined)

    socketService.resolveReadyness()

    await waitForExpect(() => {
      expect(spy).toHaveBeenCalledWith(event, undefined)
    })
  })
})
