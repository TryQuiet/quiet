import { put, take, select } from 'typed-redux-saga'
import { initSelectors } from '../../init/init.selectors'
import { navigationSelectors } from '../navigation.selectors'
import { navigationActions } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { identity, publicChannels, users } from '@quiet/state-manager'
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

  const isUsernameTaken = yield* select(identity.selectors.usernameTaken)

  if (isUsernameTaken) {
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.UsernameTakenScreen,
      })
    )
  }

  const duplicateCerts = yield* select(users.selectors.duplicateCerts)

  if (duplicateCerts) {
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.PossibleImpersonationAttackScreen,
      })
    )
    return
  }

  // If user belongs to a community, let him directly into the app
  // Check while QA session!
  const currentChannelDisplayableMessages = yield* select(publicChannels.selectors.currentChannelMessagesMergedBySender)
  const areMessagesLoaded = Object.values(currentChannelDisplayableMessages).length > 0
  const communityMembership = yield* select(identity.selectors.communityMembership)

  if (communityMembership && areMessagesLoaded) {
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
