import React from 'react'
import QR from 'react-native-qrcode-svg'
import { act } from '@testing-library/react-native'

import { connection } from '@quiet/state-manager'
import type { DeviceLinkInvite } from '@quiet/types'

import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkedDeviceQRCodeScreen } from './LinkedDeviceQRCode.screen'

describe('LinkedDeviceQRCodeScreen', () => {
  it('shows generation progress instead of rendering an empty QR code', async () => {
    const { store } = await prepareStore()
    const { getByText } = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(getByText('Generating device link')).toBeTruthy()
    expect(QR).not.toHaveBeenCalled()
  })

  it('shows generation failure without rendering an empty QR code', async () => {
    const { store } = await prepareStore()
    const { getByText, queryByText } = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    act(() => store.dispatch(connection.actions.setDeviceLinkCreationFailed(true)))

    expect(getByText('Could not generate a device link. Go back and try again.')).toBeTruthy()
    expect(queryByText('Generating device link')).toBeNull()
    expect(QR).not.toHaveBeenCalled()
  })

  it('does not auto-renew an expired invite until the QR screen is reopened', async () => {
    const { store } = await prepareStore()
    store.dispatch(
      connection.actions.setDeviceLinkInvite({
        seed: 'seed',
        id: 'invite-id' as DeviceLinkInvite['id'],
        teamId: 'team-id' as DeviceLinkInvite['teamId'],
        expiresAt: Date.now() + 60_000,
        userId: 'user-id',
        userName: 'Alice',
      })
    )
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const firstRender = renderComponent(<LinkedDeviceQRCodeScreen />, store)
    act(() => store.dispatch(connection.actions.setDeviceLinkInvite(undefined)))

    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())

    firstRender.unmount()
    renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
  })

  it('reuses an unexpired invite when the QR screen is reopened', async () => {
    const { store } = await prepareStore()
    store.dispatch(
      connection.actions.setDeviceLinkInvite({
        seed: 'seed',
        id: 'invite-id' as DeviceLinkInvite['id'],
        teamId: 'team-id' as DeviceLinkInvite['teamId'],
        expiresAt: Date.now() + 60_000,
        userId: 'user-id',
        userName: 'Alice',
      })
    )
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const firstRender = renderComponent(<LinkedDeviceQRCodeScreen />, store)
    firstRender.unmount()
    renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
  })
})
