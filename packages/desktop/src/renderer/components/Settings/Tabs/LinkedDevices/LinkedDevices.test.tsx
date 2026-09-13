import '@testing-library/jest-dom'
import React from 'react'
import { act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { prepareStore } from '../../../../testUtils/prepareStore'
import { ModalName } from '../../../../sagas/modals/modals.types'
import { modalsActions } from '../../../../sagas/modals/modals.slice'

import { LinkedDevices } from './LinkedDevices'

describe('Settings → Linked devices', () => {
  it('shows the Link devices content, asks for the device list and lists the other devices', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatch).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(dispatch).toHaveBeenCalledWith(connection.actions.createDeviceLink()) // Copy link's link, minted up front
    expect(result.getByTestId('link-devices')).toBeVisible()
    expect(result.getByTestId('link-devices-display-qr')).toBeVisible()
    expect(result.getByTestId('link-devices-copy-link')).toBeVisible()
    expect(result.queryByTestId('link-devices-scan-qr')).toBeNull()
    expect(result.queryByTestId('link-devices-paste-link')).toBeNull()
    expect(result.getByTestId('no-linked-devices')).toBeVisible()
    expect(result.queryByTestId('copy-device-link')).toBeNull() // no QR here: it lives in the sheet

    await act(async () => {
      store.dispatch(
        connection.actions.setLinkedDevices([
          { deviceId: 'me', deviceName: 'me', isCurrent: true },
          { deviceId: 'laptop', deviceName: 'laptop', isCurrent: false },
          { deviceId: 'old', deviceName: 'old-phone', isCurrent: false, removedAt: 1 },
        ])
      )
    })

    expect(result.getByTestId('linked-device-laptop')).toHaveTextContent('laptop')
    expect(result.getByTestId('linked-device-laptop')).toHaveTextContent('Active')
    expect(result.queryByTestId('linked-device-old-phone')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('Display QR code opens the Link devices modal straight at the QR sheet', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    await userEvent.click(result.getByTestId('link-devices-display-qr'))
    expect(dispatch).toHaveBeenCalledWith(
      modalsActions.openModal({ name: ModalName.linkDevicesModal, args: { step: 'display' } })
    )
  })

  it('Copy link before the link exists asks for one; with a link it copies and confirms', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)
    dispatch.mockClear()

    // Without peers the selector composes no URL: the click only asks for a link
    await userEvent.click(result.getByTestId('link-devices-copy-link'))
    expect(dispatch).toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(result.queryByText('Copied')).toBeNull()
  })

  it('without a community it receives (Scan / Paste rows) and asks for nothing', async () => {
    const { store } = await prepareStore()
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(result.queryByTestId('link-devices-display-qr')).toBeNull()
    expect(result.getByTestId('link-devices-scan-qr')).toBeVisible()
  })
})
