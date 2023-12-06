import { put, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'

export function* verifyJoinTimestampSaga(): Generator {
  const joinTimestamp = yield* select(identitySelectors.joinTimestamp)

  if (!joinTimestamp) {
    yield* put(identityActions.updateJoinTimestamp())
  }
}
