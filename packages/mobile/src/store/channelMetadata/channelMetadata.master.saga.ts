import { takeEvery, cancelled } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { channelMetadataActions } from './channelMetadata.slice'
import { saveChannelMetadataInKeychainSaga } from './saveChannelMetadataInKeychain/saveChannelMetadataInKeychain.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('channelMetadataMasterSaga')

export function* channelMetadataMasterSaga(): Generator {
  logger.info('channelMetadataMasterSaga starting')
  try {
    yield all([takeEvery(channelMetadataActions.saveChannelMetadataInKeychain.type, saveChannelMetadataInKeychainSaga)])
  } finally {
    logger.info('channelMetadataMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('channelMetadataMasterSaga cancelled')
    }
  }
}
