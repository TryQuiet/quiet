import { it, describe, expect, jest } from '@jest/globals'
import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'

import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'
import type { LinkedDevice } from '@quiet/types'

import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkDevicesScreen } from './LinkDevices.screen'

/**
 * The device list is read off the team graph, so the screen only asks for it,
 * and only draws it, once there is a community to read one from.
 */
describe('LinkDevicesScreen', () => {
  it('asks the backend for the device list and shows the other devices', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community', { name: 'Community' })
    const devices: LinkedDevice[] = [
      { deviceId: 'this', deviceName: 'pixel-here', isCurrent: true },
      { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
    ]
    store.dispatch(connection.actions.setLinkedDevices(devices))
    expect(communities.selectors.currentCommunity(store.getState())).toBeDefined()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const { getByTestId, queryByTestId } = renderComponent(<LinkDevicesScreen />, store)

    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(getByTestId('linked-device-laptop')).toBeTruthy()
    expect(queryByTestId('linked-device-this')).toBeNull()
  })

  it('does not ask for a device list without a community to read one from', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const { queryByTestId } = renderComponent(<LinkDevicesScreen />, store)

    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(queryByTestId('linked-devices-list')).toBeNull()
  })

  it('says nothing about linked devices until the read comes back', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community', { name: 'Community' })

    const { getByTestId, queryByTestId } = renderComponent(<LinkDevicesScreen />, store)

    // The request is in flight; claiming "No linked devices" here would be a guess.
    expect(queryByTestId('linked-devices-list')).toBeNull()
    expect(queryByTestId('no-linked-devices')).toBeNull()

    act(() => {
      store.dispatch(connection.actions.setLinkedDevices([]))
    })

    expect(getByTestId('no-linked-devices')).toBeTruthy()
  })
})
