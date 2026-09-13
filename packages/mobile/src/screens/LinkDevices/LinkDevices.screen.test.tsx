import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { connection } from '@quiet/state-manager'

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
})
