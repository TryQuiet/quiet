import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, put } from 'typed-redux-saga'
import { KeysUpdatedEvent } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { keysActions } from '../keys.slice'
import { keysSelectors } from '../keys.selectors.'

import _ from 'lodash'
import { NativeModules } from 'react-native'
import { StorableKey } from '../keys.type'

const logger = createLogger('saveKeysInKeychainSaga')

export function* saveKeysInKeychainSaga(action: PayloadAction<KeysUpdatedEvent>): Generator {
  logger.info('Storing keys in ios keychain')
  const existingKeys = yield* select(keysSelectors.allKeys)
  const newSecretKeys = _.differenceBy(action.payload.secretKeys, existingKeys.secretKeys, 'key')
  const newUserPublicKeys = _.differenceBy(action.payload.userPublicKeys, existingKeys.userPublicKeys, 'key')
  const newSigKeys = _.differenceBy(action.payload.sigKeys, existingKeys.sigKeys, 'key')
  logger.info('Updating keys state')
  yield* put(keysActions.setKeys(action.payload))

  const keysToSave: StorableKey[] = newSecretKeys.map(keyWithMetadata => ({
    scope: {
      ...keyWithMetadata.scope,
      keyType: 'secret',
    },
    key: keyWithMetadata.key,
    teamId: action.payload.teamId,
  }))
  keysToSave.push(
    ...newUserPublicKeys.map(keyWithMetadata => ({
      scope: {
        ...keyWithMetadata.scope,
        keyType: 'userPublic',
      },
      key: keyWithMetadata.key,
      teamId: action.payload.teamId,
    }))
  )
  keysToSave.push(
    ...newSigKeys.map(keyWithMetadata => ({
      scope: {
        ...keyWithMetadata.scope,
        keyType: 'userSig',
      },
      key: keyWithMetadata.key,
      teamId: action.payload.teamId,
    }))
  )

  logger.info('Putting new keys in keychain', keysToSave)
  try {
    yield* call(
      NativeModules.CommunicationModule.saveKeysInKeychain,
      keysToSave.map(key => JSON.stringify(key))
    )
  } catch (e) {
    logger.error('Error while updating keys on keychain', e)
  }
}
