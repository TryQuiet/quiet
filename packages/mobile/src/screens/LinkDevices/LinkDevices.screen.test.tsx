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
    it('shows Scan QR code and Paste link only, and mints nothing', async () => {
      const { dispatchSpy, result } = await renderScreen()

      expect(result.getByText('Scan QR code')).toBeTruthy()
      expect(result.getByText('Paste link')).toBeTruthy()
      expect(result.queryByText('Display QR code')).toBeNull()
      expect(result.queryByText('Copy link')).toBeNull()
      // Receiving, there is no community and so no team graph to list devices from
      // (TryQuiet/quiet#3636); the list belongs to the share direction.
      expect(result.queryByText('No linked devices')).toBeNull()
      expect(result.queryByTestId('linked-devices-list')).toBeNull()
      expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.createDeviceLink())
      expect(dispatchSpy).not.toHaveBeenCalledWith(connection.actions.getLinkedDevices())
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

    // #3520 gave mobile a real scanner, so this row opens the camera sheet rather than the
    // paste form. Paste link (below) is what reaches the paste form directly now.
    it('Scan QR code opens the scanner sheet', async () => {
      const { dispatchSpy, result } = await renderScreen()

      fireEvent.press(result.getByTestId('link-devices-scan-qr'))

      expect(dispatchSpy).toHaveBeenCalledWith(
        navigationActions.navigation({
          screen: ScreenNames.ScanQrCodeScreen,
          params: { variant: 'deviceLink' },
        })
      )
    })
  })

  describe('in a community (this device shares)', () => {
    it('shows Display QR code and Copy link only, and mints the link', async () => {
      const { dispatchSpy, result } = await renderScreen(true)

      expect(result.getByText('Display QR code')).toBeTruthy()
      expect(result.getByText('Copy link')).toBeTruthy()
      expect(result.queryByText('Scan QR code')).toBeNull()
      expect(result.queryByText('Paste link')).toBeNull()
      expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
      // The device list is asked for as soon as the screen shares, but nothing is drawn
      // until the answer arrives (TryQuiet/quiet#3636): a card reading "No linked devices"
      // before the app knows would be false as soon as a device was linked.
      expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.getLinkedDevices())
      expect(result.queryByTestId('linked-devices-list')).toBeNull()
      expect(result.queryByText('No linked devices')).toBeNull()
    })

    it('draws the device list once the read comes back, this device and removals excluded', async () => {
      const { store, result } = await renderScreen(true)

      act(() => {
        store.dispatch(
          connection.actions.setLinkedDevices([
            { deviceId: 'this', deviceName: 'pixel-here', isCurrent: true },
            { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
            { deviceId: 'gone', deviceName: 'old-tablet', isCurrent: false, removedAt: Date.now() },
          ])
        )
      })

      expect(result.getByTestId('linked-devices-list')).toBeTruthy()
      expect(result.getByTestId('linked-devices-list-label')).toBeTruthy()
      expect(result.getByTestId('linked-device-laptop')).toBeTruthy()
      expect(result.queryByTestId('linked-device-this')).toBeNull()
      expect(result.queryByTestId('linked-device-gone')).toBeNull()
      expect(result.queryByTestId('no-linked-devices')).toBeNull()
    })

    it('says "No linked devices" once the read comes back empty', async () => {
      const { store, result } = await renderScreen(true)

      act(() => {
        store.dispatch(connection.actions.setLinkedDevices([]))
      })

      expect(result.getByTestId('no-linked-devices')).toBeTruthy()
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
