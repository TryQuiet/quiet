import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { act } from '@testing-library/react-native'
import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkDevicesScreen } from './LinkDevices.screen'

describe('LinkDevicesScreen', () => {
  const renderScreen = async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<LinkDevicesScreen />, store)
    return { dispatchSpy, result }
  }

  it('shows the three rows and asks for the linked devices', async () => {
    const { dispatchSpy, result } = await renderScreen()

    expect(result.getByText('Display QR code')).toBeTruthy()
    expect(result.getByText('Scan QR code')).toBeTruthy()
    expect(result.getByText('Paste link')).toBeTruthy()
    expect(result.getByText('No linked devices')).toBeTruthy()
    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
  })

  it('Paste link opens the paste step for a device link', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('link-devices-paste-link'))

    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'pasteDeviceLink' },
      })
    )
  })

  it('Scan QR code opens the paste step as the scanner stand-in', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('link-devices-scan-qr'))

    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'deviceLink' },
      })
    )
  })

  it('Display QR code is disabled without a community', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('link-devices-display-qr'))

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.LinkedDeviceQRCodeScreen })
    )
  })

  it('in a community it lists the linked devices and enables Display QR code', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkDevicesScreen />, store)

    await act(async () => {
      store.dispatch(
        connection.actions.setLinkedDevices([
          { deviceId: 'me', deviceName: 'this phone', isCurrent: true },
          { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
          { deviceId: 'old', deviceName: 'old-phone', isCurrent: false, removedAt: 1 },
        ])
      )
    })

    expect(result.getByTestId('linked-device-nyc-laptop')).toBeTruthy()
    expect(result.getByText('nyc-laptop')).toBeTruthy()
    expect(result.getByText('Active')).toBeTruthy()
    expect(result.queryByTestId('linked-device-old-phone')).toBeNull()
    expect(result.queryByText('No linked devices')).toBeNull()

    fireEvent.press(result.getByTestId('link-devices-display-qr'))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.LinkedDeviceQRCodeScreen })
    )
  })

  it('back pops to the screen it was opened from', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkDevicesScreen />, store)

    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.pop())
  })
})
