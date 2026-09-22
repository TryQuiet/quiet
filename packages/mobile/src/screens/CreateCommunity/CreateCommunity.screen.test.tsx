import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { communities } from '@quiet/state-manager'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { initActions } from '../../store/init/init.slice'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { CreateCommunityScreen } from './CreateCommunity.screen'

describe('CreateCommunityScreen', () => {
  const openTheOffer = async () => {
    const { store } = await prepareStore()
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<CreateCommunityScreen />, store)

    fireEvent.changeText(result.getByPlaceholderText('Community name'), 'rockets')
    fireEvent.press(result.getByTestId('create-community-continue'))

    return { dispatchSpy, result }
  }

  it('gives the offer the window instead of a sheet over the create step', async () => {
    const { dispatchSpy, result } = await openTheOffer()

    // Want a server? (2922:10009) is a screen: the create step is not behind it.
    expect(result.getByTestId('server-offer-component')).toBeTruthy()
    expect(result.queryByTestId('create-community-component')).toBeNull()
    // Nothing is created until the offer is answered.
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: communities.actions.createCommunity.type })
    )
  })

  it('takes Quiet’s server, then registers the username through the terms', async () => {
    const { dispatchSpy, result } = await openTheOffer()

    fireEvent.press(result.getByTestId('server-offer-use-server'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.createCommunity({ name: 'rockets', useServer: true }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.setPendingNavigation({ screen: ScreenNames.TermsOfServiceScreen })
    )
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.UsernameRegistrationScreen })
    )
  })

  it('declines with "Not now" and goes straight to the username', async () => {
    const { dispatchSpy, result } = await openTheOffer()

    fireEvent.press(result.getByTestId('server-offer-not-now'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.createCommunity({ name: 'rockets', useServer: false }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.setPendingNavigation({ screen: ScreenNames.TermsOfServiceScreen })
    )
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.UsernameRegistrationScreen })
    )
  })

  it('treats the close glyph as "Not now", the way dismissing the old drawer did', async () => {
    const { dispatchSpy, result } = await openTheOffer()

    fireEvent.press(result.getByTestId('appbar_action_item'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.createCommunity({ name: 'rockets', useServer: false }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.setPendingNavigation({ screen: ScreenNames.TermsOfServiceScreen })
    )
  })
})
