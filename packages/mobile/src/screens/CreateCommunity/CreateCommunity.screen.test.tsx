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

  it('covers the create step with the offer instead of a sheet over it', async () => {
    const { dispatchSpy, result } = await openTheOffer()

    // Want a server? (2922:10009) is a screen: it takes the window while the offer is open.
    expect(result.getByTestId('server-offer-component')).toBeTruthy()
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

  it("returns to the create step with the name still typed when the offer's glyph goes back", async () => {
    const { dispatchSpy, result } = await openTheOffer()

    fireEvent.press(result.getByTestId('appbar_action_item'))

    // Nothing was created and nothing was decided.
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: communities.actions.createCommunity.type })
    )
    expect(result.queryByTestId('server-offer-component')).toBeNull()
    expect(result.getByPlaceholderText('Community name')).toBeTruthy()

    // The form kept the name in its own state: Continue works again without retyping, and
    // carries the same name. Unmounting the form instead would have emptied the field.
    fireEvent.press(result.getByTestId('create-community-continue'))
    expect(result.queryByText('Community name can not be empty')).toBeNull()
    fireEvent.press(result.getByTestId('server-offer-use-server'))
    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.createCommunity({ name: 'rockets', useServer: true }))
  })
})
