import { select, put, take } from 'typed-redux-saga'
import { identity, network, communities } from '@quiet/state-manager'
import { initSelectors } from '../init.selectors'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { initActions } from '../init.slice'

export function* onConnectedSaga(): Generator {
  // Do not redirect if user opened the app from url (quiet://)
  const deepLinking = yield* select(initSelectors.deepLinking)
  if (deepLinking) return

  const currentIdentity = yield* select(identity.selectors.currentIdentity)
  const currentCommunity = yield* select(communities.selectors.currentCommunity)

  const initializedCommunities = yield* select(network.selectors.initializedCommunities)
  const isCommunityInitialized = currentCommunity && initializedCommunities[currentCommunity.id]
  const isMemberOfCommunity = currentIdentity?.userCertificate

  const screen = isMemberOfCommunity ? ScreenNames.ChannelListScreen : ScreenNames.JoinCommunityScreen

  // yield* put(
  //   navigationActions.replaceScreen({
  //     screen,
  //   })
  // )

  if (isMemberOfCommunity && !isCommunityInitialized) {
    yield* take(network.actions.addInitializedCommunity)
  }

  yield* put(
    initActions.setReady(true)
  )
}
