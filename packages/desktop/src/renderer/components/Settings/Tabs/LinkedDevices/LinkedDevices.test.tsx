import '@testing-library/jest-dom'
import React from 'react'

import { communities, connection, getReduxStoreFactory, identity } from '@quiet/state-manager'
import type { DeviceLinkInvite } from '@quiet/types'

import { prepareStore } from '../../../../testUtils/prepareStore'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { LinkedDevices } from './LinkedDevices'

describe('LinkedDevices', () => {
  it('reuses the same active invitation when the panel reopens', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community', {
      name: 'Community',
      teamId: 'team-id',
      psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
    })
    const community = communities.selectors.currentCommunity(store.getState())!
    await factory.create('Identity', { communityId: community.id })
    const invite: DeviceLinkInvite = {
      id: '5ah8uYodiwuwVybT' as DeviceLinkInvite['id'],
      teamId: '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3' as DeviceLinkInvite['teamId'],
      seed: 'same-active-seed',
      expiresAt: Date.now() + 1_800_000,
      userId: identity.selectors.currentIdentity(store.getState())!.userId,
      userName: 'Alice',
    }
    store.dispatch(connection.actions.setDeviceLinkInvite(invite))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const firstRender = renderComponent(<LinkedDevices />, store)
    expect(firstRender.getByTestId('copy-device-link')).toBeVisible()
    firstRender.unmount()
    const secondRender = renderComponent(<LinkedDevices />, store)

    expect(secondRender.getByTestId('copy-device-link')).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(connection.selectors.deviceLinkInvite(store.getState())).toEqual(invite)
  })
})
