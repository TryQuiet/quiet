import { put, select } from 'typed-redux-saga'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationSelectors } from '../navigation.selectors'
import { identity } from '@quiet/state-manager'
import { navigationActions } from '../navigation.slice'

export function* redirectionSaga(): Generator {
  const currentScreen = yield* select(navigationSelectors.currentScreen)
  const pendingNavigation = yield* select(navigationSelectors.pendingNavigation)

  if (pendingNavigation) {
    yield* put(
      navigationActions.replaceScreen({
        screen: pendingNavigation,
      })
    )
    yield* put(navigationActions.clearPendingNavigation())
    return
  }
  // Do not redirect to the splash screen if user is already there (first app run)
  if (currentScreen === ScreenNames.SplashScreen) return

  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  // Before getting certificate, restore navigation to the last visited registration step. Otherwise go to the channel list screen
  const destination = currentIdentity?.userCertificate ? ScreenNames.ChannelListScreen : currentScreen
  yield* put(
    navigationActions.replaceScreen({
      screen: destination,
    })
  )
}
