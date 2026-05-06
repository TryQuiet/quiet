import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'

export function* verifyJoinTimestampSaga(): Generator {
  const joinTimestamp = yield* select(identitySelectors.joinTimestamp)

  if (!joinTimestamp) {
    const communityId = yield* select(communitiesSelectors.currentCommunityId)
    yield* put(identityActions.updateJoinTimestamp({ communityId }))
  }
}
