import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { connection } from '@quiet/state-manager'

import { LINKED_DEVICE_QR_COPY } from '../../components/LinkedDeviceQRCode/LinkedDeviceQRCode.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkedDeviceQRCodeScreen } from './LinkedDeviceQRCode.screen'

describe('LinkedDeviceQRCodeScreen', () => {
  it('drops any old link, mints a new one, and shows the sheet with the generating state', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.setDeviceLinkInvite(undefined))
    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(result.getByText(LINKED_DEVICE_QR_COPY.title)).toBeTruthy()
    expect(result.getByText(LINKED_DEVICE_QR_COPY.scan)).toBeTruthy()
    expect(result.getByText(LINKED_DEVICE_QR_COPY.generating)).toBeTruthy()
  })

  it('close goes back to Link devices', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const result = renderComponent(<LinkedDeviceQRCodeScreen />, store)

    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.pop())
  })
})
