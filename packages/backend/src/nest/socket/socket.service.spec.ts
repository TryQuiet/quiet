import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { SocketModule } from './socket.module'
import { SocketService } from './socket.service'
import { io, Socket } from 'socket.io-client'
import waitForExpect from 'wait-for-expect'
import {
  type DeviceLinkInvite,
  type InitDeviceLinkPayload,
  type ResponseLinkDevicePayload,
  SocketActions,
} from '@quiet/types'
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

  it('forwards device link requests and acknowledgements', async () => {
    const deviceLinkInvite = {
      id: 'device-link-id',
      seed: 'device-link-seed',
      expiresAt: Date.now() + 30 * 60 * 1000,
      userId: 'user-id',
      userName: 'alice',
    } as DeviceLinkInvite
    const listener = jest.fn((_payload: Record<string, never>, callback: (response?: DeviceLinkInvite) => void) =>
      callback(deviceLinkInvite)
    )

    socketService.on(SocketActions.CREATE_DEVICE_LINK, listener)

    await expect(client.emitWithAck(SocketActions.CREATE_DEVICE_LINK, {})).resolves.toEqual(deviceLinkInvite)
    expect(listener).toHaveBeenCalledWith({}, expect.any(Function))

    socketService.off(SocketActions.CREATE_DEVICE_LINK, listener)
  })

  it('forwards device admission requests and acknowledgements', async () => {
    const payload = {
      id: 'community-id',
      inviteData: {},
      deviceName: 'Desktop',
    } as InitDeviceLinkPayload
    const response = {
      id: payload.id,
      community: { id: payload.id },
      identity: { id: 'identity-id' },
    } as unknown as ResponseLinkDevicePayload
    const listener = jest.fn(
      (_payload: InitDeviceLinkPayload, callback: (response?: ResponseLinkDevicePayload) => void) => callback(response)
    )

    socketService.on(SocketActions.LINK_DEVICE, listener)

    await expect(client.emitWithAck(SocketActions.LINK_DEVICE, payload)).resolves.toEqual(response)
    expect(listener).toHaveBeenCalledWith(payload, expect.any(Function))

    socketService.off(SocketActions.LINK_DEVICE, listener)
  })

  it('there are no fragile endpoints in the collection of suspendables', async () => {
    const fragile: string[] = [SocketActions.CREATE_COMMUNITY.valueOf(), SocketActions.JOIN_COMMUNITY.valueOf()]

    fragile.forEach(event => {
      expect(suspendableSocketEvents).not.toContain(event)
    })
  })
})
