import { type PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { NativeModules } from 'react-native'

import { KeysUpdatedEvent } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveKeysInKeychainSaga')

export function* saveKeysInKeychainSaga(action: PayloadAction<KeysUpdatedEvent>): Generator {
  logger.info('Storing keys in ios keychain', action.payload.keys)
  try {
    yield* call(
      NativeModules.CommunicationModule.saveKeysInKeychain,
      action.payload.keys.map(key => JSON.stringify(key))
    )
  } catch (e) {
    logger.error('Error while updating keys on keychain', e)
  }
}
