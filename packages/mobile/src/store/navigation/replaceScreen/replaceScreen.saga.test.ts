import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'

import { ScreenNames } from '../../../const/ScreenNames.enum'
import { resetToScreen, resetToStack } from '../../../RootNavigation'
import { navigationActions } from '../navigation.slice'
import { navigationReducer, NavigationState } from '../navigation.slice'
import { resetToScreenSaga, resetToStackSaga } from './replaceScreen.saga'

describe('resetToStack', () => {
  const walkedPath = [
    ScreenNames.GetStartedScreen,
    ScreenNames.JoinCommunityScreen,
    ScreenNames.OpenInviteLinkScreen,
    ScreenNames.PasteInviteLinkScreen,
  ]

  it('hands the navigator the whole path, not just the screen to show', async () => {
    await expectSaga(resetToStackSaga, navigationActions.resetToStack({ screens: walkedPath }))
      .provide([[call.fn(resetToStack), undefined]])
      .call(resetToStack, walkedPath)
      .run()
  })

  it('records the same path as the back stack, so the shown screen has somewhere to go back to', () => {
    const state = navigationReducer(
      { ...new NavigationState(), backStack: [ScreenNames.ConnectionProcessScreen] },
      navigationActions.resetToStack({ screens: walkedPath })
    )

    expect(state.backStack).toEqual(walkedPath)
    expect(state.pendingNavigation).toBeNull()
  })

  it('is distinct from resetToScreen, which still leaves a one-deep stack', async () => {
    await expectSaga(resetToScreenSaga, navigationActions.resetToScreen({ screen: ScreenNames.AppHomeScreen }))
      .provide([[call.fn(resetToScreen), undefined]])
      .call(resetToScreen, ScreenNames.AppHomeScreen)
      .run()

    const state = navigationReducer(
      { ...new NavigationState(), backStack: walkedPath },
      navigationActions.resetToScreen({ screen: ScreenNames.AppHomeScreen })
    )
    expect(state.backStack).toEqual([ScreenNames.AppHomeScreen])
  })
})
