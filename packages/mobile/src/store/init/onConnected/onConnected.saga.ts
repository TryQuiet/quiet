import { select, put, take } from 'typed-redux-saga'
import { identity, network, communities } from '@quiet/state-manager'
import { initActions } from '../init.slice'

export function* onConnectedSaga(): Generator {
  const currentIdentity = yield* select(identity.selectors.currentIdentity)
  const currentCommunity = yield* select(communities.selectors.currentCommunity)

  const initializedCommunities = yield* select(network.selectors.initializedCommunities)
  const isCommunityInitialized = currentCommunity && initializedCommunities[currentCommunity.id]

  const isMemberOfCommunity = currentIdentity?.userCertificate

  if (isMemberOfCommunity && !isCommunityInitialized) {
    yield* take(network.actions.addInitializedCommunity)
  }

  yield* put(
    initActions.setReady(true)
  )
}
