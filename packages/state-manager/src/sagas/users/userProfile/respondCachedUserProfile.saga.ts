import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select } from 'typed-redux-saga'
import { type CachedUserProfileResponse } from '@quiet/types'
import { type CachedUserProfileRequestedActionPayload } from '../users.slice'
import { userProfileSelectors } from './userProfile.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('respondCachedUserProfileSaga')

export function* respondCachedUserProfileSaga(
  action: PayloadAction<CachedUserProfileRequestedActionPayload>
): Generator {
  const profiles = yield* select(userProfileSelectors.userProfiles)
  const profile = profiles[action.payload.userId]
  const response: CachedUserProfileResponse = profile ? { profile } : {}

  logger.info('Responding to cached user profile request', action.payload.userId, Boolean(profile))
  yield* call(action.payload.callback, response)
}
