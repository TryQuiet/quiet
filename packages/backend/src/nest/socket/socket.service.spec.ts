import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { SocketModule } from './socket.module'
import { SocketService } from './socket.service'
import { io, Socket } from 'socket.io-client'
import waitForExpect from 'wait-for-expect'
import { type DebugAddServerPayload, SocketActions } from '@quiet/types'
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

    client = io(`http://127.0.0.1:${TEST_DATA_PORT}`)
  })

  afterAll(async () => {
    client.close()
    await socketService.close()

    // TODO: Figure out why this fails and bring it back, I guess
    // await module.close()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sets no default cors', async () => {
    expect(socketService.serverIoProvider.io.engine.opts.cors).toStrictEqual({}) // No cors should be set by default
  })

  it('suspends events handling until backend is fully initialized', async () => {
    const spy = jest.spyOn(socketService, 'emit')

    const event = suspendableSocketEvents[0]

    client.emit(event)

    expect(spy).not.toBeCalledWith(event, undefined, undefined)

    socketService.resolveReadyness()

    await waitForExpect(() => {
      expect(spy).toHaveBeenCalledWith(event, undefined, undefined)
    })
  })

  it('there are no fragile endpoints in the collection of suspendables', async () => {
    const fragile: string[] = [SocketActions.CREATE_COMMUNITY.valueOf(), SocketActions.JOIN_COMMUNITY.valueOf()]

    fragile.forEach(event => {
      expect(suspendableSocketEvents).not.toContain(event)
    })
  })

  it('forwards debug server requests to backend listeners', async () => {
    const spy = jest.spyOn(socketService, 'emit')
    const payload: DebugAddServerPayload = {
      serverHosts: ['unknown-server.example.com'],
    }

    client.emit(SocketActions.DEBUG_ADD_SERVER, payload)

    await waitForExpect(() => {
      expect(spy).toHaveBeenCalledWith(SocketActions.DEBUG_ADD_SERVER, payload)
    })
  })
})
