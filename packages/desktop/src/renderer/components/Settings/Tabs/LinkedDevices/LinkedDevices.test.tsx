import '@testing-library/jest-dom'
import React from 'react'

import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'

import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'
import type { LinkedDevice } from '@quiet/types'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { prepareStore } from '../../../../testUtils/prepareStore'
import { ModalName } from '../../../../sagas/modals/modals.types'
import { modalsActions } from '../../../../sagas/modals/modals.slice'

import { LinkedDevices } from './LinkedDevices'

describe('Settings → Linked devices', () => {
  it('shows the Link devices content with the share rows, and asks for the device list', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDevices />, store)

    expect(dispatch).toHaveBeenCalledWith(connection.actions.createDeviceLink()) // Copy link's link, minted up front
    expect(result.getByTestId('link-devices')).toBeVisible()
    expect(result.getByTestId('link-devices-display-qr')).toBeVisible()
    expect(result.getByTestId('link-devices-copy-link')).toBeVisible()
    expect(result.queryByTestId('link-devices-scan-qr')).toBeNull()
    expect(result.queryByTestId('link-devices-paste-link')).toBeNull()
    expect(result.queryByTestId('copy-device-link')).toBeNull() // no QR here: it lives in the sheet

    // The device list is asked for as soon as the surface shares, but nothing is drawn
    // until the answer arrives: a card reading "No linked devices" before the app knows
    // would be false as soon as a device was linked.
    expect(dispatch).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(result.queryByTestId('linked-devices-list')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('draws the device list once the read comes back, this device excluded', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const devices: LinkedDevice[] = [
      { deviceId: 'this', deviceName: 'desktop-here', isCurrent: true },
      { deviceId: 'phone', deviceName: 'nyc-phone', isCurrent: false },
      { deviceId: 'gone', deviceName: 'old-tablet', isCurrent: false, removedAt: Date.now() },
    ]

    const result = renderComponent(<LinkedDevices />, store)
    act(() => {
      store.dispatch(connection.actions.setLinkedDevices(devices))
    })

    expect(result.getByTestId('linked-devices-list')).toBeVisible()
    expect(result.getByTestId('linked-devices-list-label')).toHaveTextContent('Linked devices')
    expect(result.getByTestId('linked-device-phone')).toHaveTextContent('nyc-phone')
    expect(result.queryByTestId('linked-device-this')).toBeNull()
    expect(result.queryByTestId('linked-device-gone')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('says "No linked devices" once the read comes back empty', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const result = renderComponent(<LinkedDevices />, store)
    act(() => {
      store.dispatch(connection.actions.setLinkedDevices([]))
    })

    expect(result.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })

  it('Display QR code opens the QR code one level down in this panel, not a modal', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatch = jest.spyOn(store, 'dispatch')
    const openTab = jest.fn()

    const result = renderComponent(<LinkedDevices openTab={openTab} />, store)
    dispatch.mockClear()

    await userEvent.click(result.getByTestId('link-devices-display-qr'))
    expect(openTab).toHaveBeenCalledWith('linkedDevicesQr')
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: modalsActions.openModal.type }))
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

    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(dispatch).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
    expect(result.queryByTestId('link-devices-display-qr')).toBeNull()
    expect(result.getByTestId('link-devices-scan-qr')).toBeVisible()
    // Receiving, there is no community and so no team graph to list devices from.
    expect(result.queryByTestId('linked-devices-list')).toBeNull()
  })
})
