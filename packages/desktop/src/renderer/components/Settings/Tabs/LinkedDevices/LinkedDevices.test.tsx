import '@testing-library/jest-dom'
import React from 'react'
import { act } from '@testing-library/react'

import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { prepareStore } from '../../../../testUtils/prepareStore'

import { LinkedDevices } from './LinkedDevices'

describe('LinkedDevices tab', () => {
  it('asks the backend for the device list and lists the other devices', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatch).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(result.getByTestId('no-linked-devices')).toBeVisible()

    await act(async () => {
      store.dispatch(
        connection.actions.setLinkedDevices([
          { deviceId: 'me', deviceName: 'me', isCurrent: true },
          { deviceId: 'laptop', deviceName: 'laptop', isCurrent: false },
        ])
      )
    })

    expect(result.getByTestId('linked-device-laptop')).toHaveTextContent('laptop')
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('does not ask for a device list without a community', async () => {
    const { store } = await prepareStore()
    const dispatch = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkedDevices />, store)

    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
  })
})
