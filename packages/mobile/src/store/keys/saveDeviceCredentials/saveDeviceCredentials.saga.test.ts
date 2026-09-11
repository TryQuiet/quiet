import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'

import { saveDeviceCredentialsSaga } from './saveDeviceCredentials.saga'
import { keysActions } from '../keys.slice'

describe('saveDeviceCredentialsSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stores device credentials and local user identity in the native bridge', async () => {
    const payload = {
      deviceId: 'device-id',
      userId: 'self-id',
      teamId: 'team-id',
      signingPrivateKey: 'private-signing-key',
    }

    await expectSaga(saveDeviceCredentialsSaga, keysActions.saveDeviceCredentials(payload))
      .call(
        NativeModules.CommunicationModule.saveDeviceCredentials,
        payload.deviceId,
        payload.teamId,
        payload.signingPrivateKey,
        payload.userId
      )
      .run()
  })
})
