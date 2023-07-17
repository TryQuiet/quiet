import { select, put, take } from 'typed-redux-saga'
import { identity, network } from '@quiet/state-manager'
import { initSelectors } from '../init.selectors'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'

export function* onConnectedSaga(): Generator {
  // Do not redirect if user opened the app from url (quiet://)
  const deepLinking = yield* select(initSelectors.deepLinking)
  if (deepLinking) return

  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  const isMemberOfCommunity = currentIdentity?.userCertificate
  const isCommunityInitialized = Boolean(network.selectors.initializedCommunities.length)
  console.log('isMemberOfCommunity ', isMemberOfCommunity)
  console.log('isCommunityInitialized ', isCommunityInitialized)

  const screen = !isMemberOfCommunity ? ScreenNames.JoinCommunityScreen : ScreenNames.ChannelListScreen

  if (isMemberOfCommunity && !isCommunityInitialized) {
    yield* take(network.actions.addInitializedCommunity)
  }

  yield* put(
    navigationActions.replaceScreen({
      screen,
    })
  )
}
