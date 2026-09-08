import { initActions } from '../../init/init.slice'
import { NativeEventKeys } from './nativeEvent.keys'

const mockListeners = new Map<string, (...args: any[]) => void>()
const mockRemove = jest.fn()

jest.mock('./nativeEventEmitter', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn((event: string, listener: (...args: any[]) => void) => {
      mockListeners.set(event, listener)
      return { remove: mockRemove }
    }),
  },
}))

import { deviceEvents } from './nativeServicesCallbacks'

const takeFromChannel = <T>(channel: { take: (callback: (input: T) => void) => void }): Promise<T> =>
  new Promise(resolve => channel.take(resolve))

describe('deviceEvents', () => {
  beforeEach(() => {
    mockListeners.clear()
    mockRemove.mockClear()
  })

  it('maps AppResume to websocket recovery and removes native listeners on close', async () => {
    const channel = deviceEvents()
    const resumed = takeFromChannel(channel)

    mockListeners.get(NativeEventKeys.AppResume)?.()

    await expect(resumed).resolves.toEqual(initActions.resumeWebsocketConnection())

    channel.close()
    expect(mockRemove).toHaveBeenCalledTimes(5)
  })
})
