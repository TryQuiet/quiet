import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { LinkDevicesScreen } from '../LinkDevices/LinkDevices.screen'
import { RecoverAccountScreen } from './RecoverAccount.screen'

// The Link devices screen copies the minted device link (design/link-devices-paste); the
// native clipboard has no jest binding, so it is mocked the way that screen's own test does.
jest.mock('@react-native-clipboard/clipboard', () => ({ setString: jest.fn() }))

describe('RecoverAccountScreen', () => {
  const renderScreen = async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<RecoverAccountScreen />, store)
    return { dispatchSpy, result }
  }

  it("shows the frame's copy and omits More options", async () => {
    const { result } = await renderScreen()

    // The frame hides the bar title; only the back glyph and the heading
    expect(result.queryByText('Account recovery')).toBeNull()
    expect(result.getByLabelText('Go back')).toBeTruthy()
    expect(result.getByText('Recover account')).toBeTruthy()
    expect(
      result.getByText('Locked out? You can recover with a linked device or ask an admin to send you an invite link.')
    ).toBeTruthy()
    // The frame draws a "More options" row with no target; it is omitted until the design gives it one
    expect(result.queryByTestId('recover-more-options')).toBeNull()
    expect(result.queryByText('More options')).toBeNull()
  })

  it('"Use linked device" goes to Link devices', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('recover-use-linked-device'))

    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.LinkDevicesScreen }))
  })

  it('"Use linked device" pushes Link devices, whose back pops to Recover account', async () => {
    const { store } = await prepareStore()
    store.dispatch(navigationActions.navigation({ screen: ScreenNames.JoinCommunityScreen }))
    store.dispatch(navigationActions.navigation({ screen: ScreenNames.RecoverAccountScreen }))

    const recover = renderComponent(<RecoverAccountScreen />, store)
    fireEvent.press(recover.getByTestId('recover-use-linked-device'))
    expect(navigationSelectors.currentScreen(store.getState())).toBe(ScreenNames.LinkDevicesScreen)

    const linkDevices = renderComponent(<LinkDevicesScreen />, store)
    fireEvent.press(linkDevices.getByTestId('appbar_action_item'))
    expect(navigationSelectors.currentScreen(store.getState())).toBe(ScreenNames.RecoverAccountScreen)
  })

  it('"Use invite link" goes to Join with invite link', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('recover-use-invite-link'))

    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.OpenInviteLinkScreen }))
  })
})
