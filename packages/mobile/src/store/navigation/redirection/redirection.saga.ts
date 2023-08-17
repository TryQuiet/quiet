import { put, take, select } from 'typed-redux-saga'
import { initSelectors } from '../../init/init.selectors'
import { navigationSelectors } from '../navigation.selectors'
import { navigationActions } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { identity } from '@quiet/state-manager'
import { initActions } from '../../init/init.slice'

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

  // If user belongs to a community, let him directly into the app
  const communityMembership = yield* select(identity.selectors.communityMembership)

  if (communityMembership) {
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen,
      })
    )
    return
  }

  // If user doesn't belong to a community, wait for websocket connection and redirect to welcome screen
  yield* take(initActions.setWebsocketConnected)

  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.JoinCommunityScreen,
    })
  )
}
