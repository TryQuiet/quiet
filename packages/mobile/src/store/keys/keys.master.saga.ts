import { takeEvery, cancelled } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { type Socket } from '@quiet/state-manager/src/types'
import { keysActions } from './keys.slice'
import { saveKeysInKeychainSaga } from './saveKeysInKeychain/saveKeysInKeychain.saga'
import { saveDeviceCredentialsSaga } from './saveDeviceCredentials/saveDeviceCredentials.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('keysMasterSaga')

export function* keysMasterSaga(): Generator {
  logger.info('keysMasterSaga starting')
  try {
    yield all([
      takeEvery(keysActions.saveKeysInKeychain.type, saveKeysInKeychainSaga),
      takeEvery(keysActions.saveDeviceCredentials.type, saveDeviceCredentialsSaga),
    ])
  } finally {
    logger.info('keysMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('keysMasterSaga cancelled')
    }
  }
}
