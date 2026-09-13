import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'

import { communities, connection, getReduxStoreFactory } from '@quiet/state-manager'
import Clipboard from '@react-native-clipboard/clipboard'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkDevicesScreen } from './LinkDevices.screen'

describe('LinkDevicesScreen', () => {
  const renderScreen = async (withCommunity = false) => {
    const { store } = await prepareStore()
    if (withCommunity) {
      const factory = await getReduxStoreFactory(store)
      const community = await factory.create('Community', { name: 'devices' })
      store.dispatch(communities.actions.setCurrentCommunity(community.id))
    }
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<LinkDevicesScreen />, store)
    return { store, dispatchSpy, result }
  }

  describe('without a community (this device receives)', () => {
    it('shows Scan QR code and Paste link only, and asks for the linked devices', async () => {
      const { dispatchSpy, result } = await renderScreen()

      expect(result.getByText('Scan QR code')).toBeTruthy()
      expect(result.getByText('Paste link')).toBeTruthy()
      expect(result.queryByText('Display QR code')).toBeNull()
      expect(result.queryByText('Copy link')).toBeNull()
      expect(result.getByText('No linked devices')).toBeTruthy()
      expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
      expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
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
  })

  describe('in a community (this device shares)', () => {
    it('shows Display QR code and Copy link only, mints the link, and lists the linked devices', async () => {
      const { store, dispatchSpy, result } = await renderScreen(true)

      expect(result.getByText('Display QR code')).toBeTruthy()
      expect(result.getByText('Copy link')).toBeTruthy()
      expect(result.queryByText('Scan QR code')).toBeNull()
      expect(result.queryByText('Paste link')).toBeNull()
      expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())

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
      expect(result.getByText('Active')).toBeTruthy()
      expect(result.queryByTestId('linked-device-old-phone')).toBeNull()
      expect(result.queryByText('No linked devices')).toBeNull()

      fireEvent.press(result.getByTestId('link-devices-display-qr'))
      expect(dispatchSpy).toHaveBeenCalledWith(
        navigationActions.navigation({ screen: ScreenNames.LinkedDeviceQRCodeScreen })
      )
    })

    it('Copy link before the link exists asks for one and copies nothing', async () => {
      const { dispatchSpy, result } = await renderScreen(true)
      dispatchSpy.mockClear()

      fireEvent.press(result.getByTestId('link-devices-copy-link'))

      expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
      expect(Clipboard.setString).not.toHaveBeenCalled()
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: navigationActions.toggleConfirmationBox.type })
      )
    })
  })

  it('back pops to the screen it was opened from', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.pop())
  })
})
