import { type DeviceLinkInvite } from '@quiet/types'

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
})
