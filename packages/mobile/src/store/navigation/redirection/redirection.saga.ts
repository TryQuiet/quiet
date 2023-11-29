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
  if (deepLinking) {
    console.log('INIT_NAVIGATION: Proceeding with deep link flow.')
    return
  }

  // Redirect if user opened the app from push notification
  const pendingNavigation = yield* select(navigationSelectors.pendingNavigation)
  if (pendingNavigation) {
    console.log('INIT_NAVIGATION: Pending navigation redirection: ', pendingNavigation)
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
    console.log('INIT_NAVIGATION: Switching to the channel list screen (community membership).')
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen,
      })
    )
    return
  }

  // If user doesn't belong to a community, wait for websocket connection and redirect to welcome screen
  console.log('INIT_NAVIGATION: Waiting for websocket connection before proceeding.')
  const connection = yield* select(initSelectors.isWebsocketConnected)
  if (!connection) {
    yield* take(initActions.setWebsocketConnected)
  }

  console.log('INIT_NAVIGATION: Switching to the join community screen.')
  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.JoinCommunityScreen,
    })
  )
}
