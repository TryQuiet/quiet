import { select, put, take } from 'typed-redux-saga'
import { identity, network } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { navigationSelectors } from '../../navigation/navigation.selectors'
import { ScreenNames } from '../../../const/ScreenNames.enum'

export function* onConnectedSaga(): Generator {
  const communityMembership = yield* select(identity.selectors.communityMembership)

  if (!communityMembership) {
    // Is user doesn't belong to a community yet, let's not wait for any further initialization...
    yield* put(initActions.setReady(true))

    // ...instead take him to the joining process (continue on a proper screen if paused on username registration)
    let destination = ScreenNames.JoinCommunityScreen

    const currentScreen = yield* select(navigationSelectors.currentScreen)

    if (currentScreen != ScreenNames.SplashScreen) {
      destination = currentScreen
    }

    yield* put(
      navigationActions.replaceScreen({
        screen: destination,
      })
    )

    return
  }

  const isCurrentCommunityInitialized = yield* select(network.selectors.isCurrentCommunityInitialized)

  if (!isCurrentCommunityInitialized) {
    yield* take(network.actions.addInitializedCommunity)
  }

  yield* put(initActions.setReady(true))
}
