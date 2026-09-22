import '@testing-library/jest-dom'
import React from 'react'
import { act } from '@testing-library/react'

import { communities, connection, getReduxStoreFactory, identity } from '@quiet/state-manager'
import type { DeviceLinkInvite, LinkedDevice } from '@quiet/types'

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

  it('asks the backend for the device list and shows the other devices', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community', {
      name: 'Community',
      teamId: 'team-id',
      psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
    })
    const community = communities.selectors.currentCommunity(store.getState())!
    await factory.create('Identity', { communityId: community.id })
    const devices: LinkedDevice[] = [
      { deviceId: 'this', deviceName: 'desktop-here', isCurrent: true },
      { deviceId: 'phone', deviceName: 'nyc-phone', isCurrent: false },
    ]
    store.dispatch(connection.actions.setLinkedDevices(devices))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(result.getByTestId('linked-device-phone')).toHaveTextContent('nyc-phone')
    expect(result.queryByTestId('linked-device-this')).toBeNull()
  })

  it('does not ask for a device list without a community to read one from', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(result.queryByTestId('linked-devices-list')).toBeNull()
  })

  it('says nothing about linked devices until the read comes back', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community', {
      name: 'Community',
      teamId: 'team-id',
      psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
    })
    const community = communities.selectors.currentCommunity(store.getState())!
    await factory.create('Identity', { communityId: community.id })

    const result = renderComponent(<LinkedDevices />, store)

    // The request is in flight; claiming "No linked devices" here would be a guess.
    expect(result.queryByTestId('linked-devices-list')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()

    act(() => {
      store.dispatch(connection.actions.setLinkedDevices([]))
    })

    expect(result.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })
})
