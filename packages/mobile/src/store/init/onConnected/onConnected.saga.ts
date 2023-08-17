import { select, put, take } from 'typed-redux-saga'
import { identity, network } from '@quiet/state-manager'
import { initActions } from '../init.slice'

export function* onConnectedSaga(): Generator {
  // Is user doesn't belong to a community yet, let's not wait for any further initialization
  const communityMembership = yield* select(identity.selectors.communityMembership)

  if (!communityMembership) {
    yield* put(initActions.setReady(true))
    return
  }

  // If user belongs to a community, let's wait for it to initialize
  const isCurrentCommunityInitialized = yield* select(network.selectors.isCurrentCommunityInitialized)

  if (!isCurrentCommunityInitialized) {
    yield* take(network.actions.addInitializedCommunity)
  }

  yield* put(initActions.setReady(true))
}
