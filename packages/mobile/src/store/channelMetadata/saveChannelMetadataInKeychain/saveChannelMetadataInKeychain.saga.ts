import { type PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { NativeModules } from 'react-native'

import { type MobileChannelMetadataUpdatedPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveChannelMetadataInKeychainSaga')

export function* saveChannelMetadataInKeychainSaga(
  action: PayloadAction<MobileChannelMetadataUpdatedPayload>
): Generator {
  const { teamId, channelMetadata } = action.payload
  logger.debug(
    'Storing channel metadata in native keychain',
    teamId,
    channelMetadata.map(channel => channel.channelId)
  )
  try {
    yield* call(
      NativeModules.CommunicationModule.saveChannelMetadataInKeychain,
      teamId,
      channelMetadata.map(channel => JSON.stringify(channel))
    )
  } catch (e) {
    logger.error('Error while updating channel metadata on native keychain', e)
  }
}
