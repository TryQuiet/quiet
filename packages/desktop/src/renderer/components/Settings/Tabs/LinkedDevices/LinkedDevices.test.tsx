import '@testing-library/jest-dom'
import React from 'react'
import { act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'
import type { DeviceLinkInvite } from '@quiet/types'

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

  it('mints a device link inside a community, and Reset QR code drops it so a new one is minted', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatch).toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(result.getByText('Generating device link…')).toBeVisible()
    expect(result.getByTestId('reset-qr-code')).toBeDisabled()

    await act(async () => {
      store.dispatch(
        connection.actions.setDeviceLinkInvite({
          id: 'invite-id' as unknown as DeviceLinkInvite['id'],
          teamId: 'team-id' as unknown as DeviceLinkInvite['teamId'],
          seed: 'seed',
          userId: 'user-id',
          userName: 'user',
          expiresAt: Date.now() + 60_000,
        })
      )
    })
    dispatch.mockClear()

    // Without peers the selector composes no URL; the sheet keeps the generating state and Reset stays disabled.
    expect(result.getByTestId('reset-qr-code')).toBeDisabled()
    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
  })

  it('does not ask for a device list without a community', async () => {
    const { store } = await prepareStore()
    const dispatch = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkedDevices />, store)

    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
  })
})
