import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'

import { saveChannelMetadataInKeychainSaga } from './saveChannelMetadataInKeychain.saga'
import { channelMetadataActions } from '../channelMetadata.slice'
import type { MobileChannelMetadataUpdatedPayload } from '@quiet/types'

describe('saveChannelMetadataInKeychainSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('serializes key payloads before saving them to the iOS keychain', async () => {
    const payload: MobileChannelMetadataUpdatedPayload = {
      teamId: 'foobar',
      channelMetadata: [
        {
          channelName: 'foo',
          channelId: '123',
        },
        {
          channelName: 'bar',
          channelId: '456',
        },
      ],
    }

    await expectSaga(saveChannelMetadataInKeychainSaga, channelMetadataActions.saveChannelMetadataInKeychain(payload))
      .call(
        NativeModules.CommunicationModule.saveChannelMetadataInKeychain,
        payload.teamId,
        payload.channelMetadata.map(metadata => JSON.stringify(metadata))
      )
      .run()
  })
})
