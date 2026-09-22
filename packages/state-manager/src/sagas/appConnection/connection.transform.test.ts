import { type DeviceLinkInvite, type LinkedDevice } from '@quiet/types'

import { StoreKeys } from '../store.keys'
import { ConnectionState } from './connection.slice'
import { ConnectionTransform } from './connection.transform'

describe('ConnectionTransform', () => {
  it('excludes ephemeral device-link state from persisted state', () => {
    const invite: DeviceLinkInvite = {
      id: '5ah8uYodiwuwVybT' as DeviceLinkInvite['id'],
      teamId: '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3' as DeviceLinkInvite['teamId'],
      seed: 'device-link-seed',
      expiresAt: Date.now() + 1_800_000,
      userId: 'user-id',
      userName: 'Alice device owner',
    }
    const state = Object.assign(new ConnectionState(), {
      deviceLinkInvite: invite,
      deviceLinkCreationFailed: true,
    })

    const persisted = ConnectionTransform.in(state, StoreKeys.Connection, {})

    expect(persisted.deviceLinkInvite).toBeUndefined()
    expect(persisted.deviceLinkCreationFailed).toBe(false)
  })

  it('does not carry a stale linked-device list across a restart', () => {
    const devices: LinkedDevice[] = [
      { deviceId: 'this-device', deviceName: 'this-device', isCurrent: true },
      { deviceId: 'laptop', deviceName: 'laptop', isCurrent: false },
    ]
    const state = Object.assign(new ConnectionState(), { linkedDevices: devices })

    // The list is read back from the team graph on demand, so a persisted copy
    // would show devices that may since have been removed.
    expect(ConnectionTransform.in(state, StoreKeys.Connection, {}).linkedDevices).toEqual([])
    expect(ConnectionTransform.out(state, StoreKeys.Connection, {}).linkedDevices).toEqual([])
  })
})
