import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { JoinCommunityScreen } from './JoinCommunity.screen'
import { type JoinCommunityScreenProps } from './JoinCommunity.types'

/**
 * The screen is the three-way choice now; pasting a link and everything that follows from it lives
 * on PasteInviteLinkScreen, which carries those tests.
 */
describe('JoinCommunityScreen', () => {
  const route: JoinCommunityScreenProps['route'] = {
    key: 'join-community',
    name: ScreenNames.JoinCommunityScreen,
    params: {},
  }

  const renderScreen = async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<JoinCommunityScreen route={route} />, store)
    return { dispatchSpy, result }
  }

  it('opens the invite-link flow', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('join-with-invite-link'))

    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.OpenInviteLinkScreen }))
  })

  it('takes the pasted link for the QR-code flow, since this build has no scanner', async () => {
    const { dispatchSpy, result } = await renderScreen()

    fireEvent.press(result.getByTestId('join-with-qr-code'))

    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'qrCode' },
      })
    )
  })

  it('opens Account recovery, the designed info screen', async () => {
    const { dispatchSpy, result } = await renderScreen()

    const row = result.getByTestId('recover-account')
    expect(row.props.accessibilityState?.disabled).toBeFalsy()

    fireEvent.press(row)

    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.RecoverAccountScreen }))
  })
})
