import React from 'react'
import { act, waitFor } from '@testing-library/react-native'

import { communities, network } from '@quiet/state-manager'
import { LoadingPanelType } from '@quiet/types'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { JOIN_FAILURE_STACK } from '../../store/navigation/joinFailure'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { ConnectionProcessScreen } from './ConnectionProcess.screen'

/**
 * Where the progress screen sends the user when the attempt it is showing fails.
 *
 * A failed join is reported on the invite field, so it goes back to the field the link was
 * typed in - including a request the backend refused outright, which is the case that used
 * to end at the three-way choice with nothing said about it at all.
 */
describe('ConnectionProcessScreen, when the attempt fails', () => {
  const renderScreen = async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<ConnectionProcessScreen />, store)
    return { dispatchSpy, result, store }
  }

  const fail = (store: Awaited<ReturnType<typeof prepareStore>>['store']) =>
    act(() => {
      store.dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Failed))
    })

  it('returns a refused join to the paste screen, with the path beneath it', async () => {
    const { dispatchSpy, store } = await renderScreen()
    act(() => {
      store.dispatch(communities.actions.setJoinCommunityError({ type: 'refused' }))
    })

    fail(store)

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.resetToStack({ screens: JOIN_FAILURE_STACK }))
    )
    expect(JOIN_FAILURE_STACK[JOIN_FAILURE_STACK.length - 1]).toBe(ScreenNames.PasteInviteLinkScreen)
    // Not the three-way choice, which has no field to carry the message.
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen })
    )
  })

  it.each([
    ['an admission timeout', { type: 'timeout', invitationType: 'community' } as const],
    ['an invalid invitation', { type: 'invalid' } as const],
  ])('returns %s to the paste screen too', async (_kind, joinCommunityError) => {
    const { dispatchSpy, store } = await renderScreen()
    act(() => {
      store.dispatch(communities.actions.setJoinCommunityError(joinCommunityError))
    })

    fail(store)

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.resetToStack({ screens: JOIN_FAILURE_STACK }))
    )
  })

  it('leaves a failure with nothing to report on the three-way choice, as before', async () => {
    // A failed community creation reaches the same screen and has no invite field to go back
    // to, so it keeps the behaviour it had.
    const { dispatchSpy, store } = await renderScreen()

    fail(store)

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen })
      )
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(navigationActions.resetToStack({ screens: JOIN_FAILURE_STACK }))
  })

  it('goes nowhere while the attempt is still running', async () => {
    const { dispatchSpy, store } = await renderScreen()
    act(() => {
      store.dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    })

    expect(dispatchSpy).not.toHaveBeenCalledWith(navigationActions.resetToStack({ screens: JOIN_FAILURE_STACK }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen })
    )
  })
})
