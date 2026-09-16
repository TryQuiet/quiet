import { describe, expect, it, jest } from '@jest/globals'
import { type DeviceNetworkEndpoint } from '@quiet/types'

import { StorageEvents } from '../storage.types'
import { NetworkEndpointsStore } from './networkEndpoints.store'

const endpoint = (deviceId: string): DeviceNetworkEndpoint => ({
  teamId: 'team-id',
  userId: 'user-id',
  deviceId,
  onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
  peerId: '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
})

describe('NetworkEndpointsStore', () => {
  it('retains inactive records but emits only endpoints for active devices', async () => {
    const activeEndpoint = endpoint('active-device')
    const inactiveEndpoint = endpoint('inactive-device')
    const auth = {
      on: jest.fn(),
      getActiveChain: jest.fn(() => ({
        team: {
          id: 'team-id',
          hasDevice: (deviceId: string) => deviceId === activeEndpoint.deviceId,
        },
      })),
    }
    const store = new NetworkEndpointsStore({} as any, auth as any, {} as any)
    jest.spyOn(store, 'getNetworkEndpoints').mockResolvedValue([activeEndpoint, inactiveEndpoint])
    const emitSpy = jest.spyOn(store, 'emit')

    await (store as any).emitActiveNetworkEndpoints()

    expect(emitSpy).toHaveBeenCalledWith(StorageEvents.NETWORK_ENDPOINTS_STORED, {
      endpoints: [activeEndpoint],
    })
    expect(store.getNetworkEndpoints).toHaveBeenCalledTimes(1)
  })
})
