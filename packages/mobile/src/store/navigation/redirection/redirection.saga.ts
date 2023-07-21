import { put, select } from 'typed-redux-saga'
import { initSelectors } from '../../init/init.selectors'
import { navigationSelectors } from '../navigation.selectors'
import { navigationActions } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { identity } from '@quiet/state-manager'

export function* redirectionSaga(): Generator {
  // Do not redirect if user opened the app from url (quiet://)
  const deepLinking = yield* select(initSelectors.deepLinking)
  if (deepLinking) return

  // Redirect if user opened the app from push notification
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

  const currentScreen = yield* select(navigationSelectors.currentScreen)

  // Do not redirect to the splash screen if user is already there (continue after websocket connection (onConnectedSaga))
  if (currentScreen === ScreenNames.SplashScreen) return

  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  // Before getting certificate, restore navigation to the last visited registration step. Otherwise go to the channel list screen
  let destination = currentIdentity?.userCertificate ? ScreenNames.ChannelListScreen : currentScreen

  yield* put(
    navigationActions.replaceScreen({
      screen: destination,
    })
  )
}
