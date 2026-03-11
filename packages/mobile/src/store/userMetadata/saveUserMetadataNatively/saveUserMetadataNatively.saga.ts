import { type PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { NativeModules } from 'react-native'

import { UserProfilesUpdatedPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveUserMetadataNativelySaga')

export function* saveUserMetadataNativelySaga(action: PayloadAction<UserProfilesUpdatedPayload>): Generator {
  logger.info('Storing user metadata in ios native storage', action.payload.profiles)
  try {
    const updates: string[] = action.payload.profiles.map(profile => JSON.stringify(profile))
    yield* call(NativeModules.CommunicationModule.saveUserMetadata, updates)
  } catch (e) {
    logger.error('Error while updating user metadata in ios native storage', e)
  }
}
