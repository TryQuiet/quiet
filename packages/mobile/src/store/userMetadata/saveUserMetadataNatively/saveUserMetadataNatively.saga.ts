import { type PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { NativeModules } from 'react-native'

import { UserProfilesUpdatedPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveUserMetadataNativelySaga')

export function* saveUserMetadataNativelySaga(action: PayloadAction<UserProfilesUpdatedPayload>): Generator {
  logger.info(
    `Storing user metadata in ios native storage (new count = ${action.payload.new.length}, update count = ${action.payload.updates.length})`
  )
  try {
    const updates: string[] = [
      ...action.payload.new.map(profile => JSON.stringify(profile)),
      ...action.payload.updates.map(profile => JSON.stringify(profile)),
    ]
    yield* call(NativeModules.CommunicationModule.saveUserMetadata, updates)
  } catch (e) {
    logger.error('Error while updating user metadata in ios native storage', e)
  }
}
