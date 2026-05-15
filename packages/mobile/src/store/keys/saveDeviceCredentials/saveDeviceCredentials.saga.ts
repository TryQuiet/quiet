import { type PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { NativeModules } from 'react-native'

import { DeviceCredentialsUpdatedEvent } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveDeviceCredentialsSaga')

export function* saveDeviceCredentialsSaga(action: PayloadAction<DeviceCredentialsUpdatedEvent>): Generator {
  logger.info('Storing device credentials in iOS keychain')
  try {
    yield* call(
      NativeModules.CommunicationModule.saveDeviceCredentials,
      action.payload.deviceId,
      action.payload.teamId,
      action.payload.signingPrivateKey
    )
  } catch (e) {
    logger.error('Error storing device credentials', e)
  }
}
