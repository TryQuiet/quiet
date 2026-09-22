import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import QR from 'react-native-qrcode-svg'

import { connection } from '@quiet/state-manager'
import type { DeviceLinkInvite } from '@quiet/types'

import { LINKED_DEVICE_QR_COPY } from '../../components/LinkedDeviceQRCode/LinkedDeviceQRCode.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkedDeviceQRCodeScreen } from './LinkedDeviceQRCode.screen'

const invite = (expiresAt: number): DeviceLinkInvite =>
  ({
    seed: 'seed',
    id: 'invite-id' as DeviceLinkInvite['id'],
    teamId: 'team-id' as DeviceLinkInvite['teamId'],
    expiresAt,
    userId: 'user-id',
    userName: 'Alice',
  }) as DeviceLinkInvite

describe('LinkedDeviceQRCodeScreen', () => {
  it('shows the sheet and the generating state while there is no link yet', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(result.getByText(LINKED_DEVICE_QR_COPY.title)).toBeTruthy()
    expect(result.getByText(LINKED_DEVICE_QR_COPY.scan)).toBeTruthy()
    expect(result.getByText(LINKED_DEVICE_QR_COPY.generating)).toBeTruthy()
    expect(QR).not.toHaveBeenCalled()
  })

  /**
   * A device link is reusable until it expires, so reopening the screen must not throw the current
   * one away — that would invalidate a link the user had already sent to their other device.
   */
  it('reuses an unexpired invite when the screen is reopened', async () => {
    const { store } = await prepareStore()
    store.dispatch(connection.actions.setDeviceLinkInvite(invite(Date.now() + 60_000)))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const first = renderComponent(<LinkedDeviceQRCodeScreen />, store)
    first.unmount()
    renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.setDeviceLinkInvite(undefined))
  })

  it('mints a new link when the current one has expired', async () => {
    const { store } = await prepareStore()
    store.dispatch(connection.actions.setDeviceLinkInvite(invite(Date.now() - 1)))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
  })

  it('states what the link actually is — reusable until it expires, not a one-shot code', async () => {
    const { store } = await prepareStore()

    const result = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(result.getByTestId('linked-device-qr-code-security')).toBeTruthy()
    expect(result.getByText(LINKED_DEVICE_QR_COPY.security)).toBeTruthy()
  })

  it('says so when the link could not be generated', async () => {
    const { store } = await prepareStore()
    const result = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    act(() => {
      store.dispatch(connection.actions.setDeviceLinkCreationFailed(true))
    })

    expect(result.getByText(LINKED_DEVICE_QR_COPY.failed)).toBeTruthy()
    expect(result.queryByText(LINKED_DEVICE_QR_COPY.generating)).toBeNull()
    expect(QR).not.toHaveBeenCalled()
  })

  it('close goes back to Link devices', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.pop())
  })
})
