import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { RecoverAccountScreen } from './RecoverAccount.screen'

describe('RecoverAccountScreen', () => {
  const renderScreen = async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<RecoverAccountScreen />, store)
    return { dispatchSpy, result }
  }

  it("shows the frame's copy with More options inert", async () => {
    const { result } = await renderScreen()

    expect(result.getByText('Account recovery')).toBeTruthy()
    expect(result.getByText('Recover account')).toBeTruthy()
    expect(
      result.getByText('Locked out? You can recover with a linked device or ask an admin to send you an invite link.')
    ).toBeTruthy()
    expect(result.getByTestId('recover-more-options')).toBeDisabled()
  })

  it('"Use linked device" goes to Link devices', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('recover-use-linked-device'))

    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.LinkDevicesScreen }))
  })

  it('"Use invite link" goes to Join with invite link', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('recover-use-invite-link'))

    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.OpenInviteLinkScreen }))
  })
})
