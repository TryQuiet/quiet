// import { NativeModules } from 'react-native'
// import { expectSaga } from 'redux-saga-test-plan'

// import { saveKeysInKeychainSaga } from './saveChannelMetadataInKeychain.saga'
// import { channelMetadataActions } from '../channelMetadata.slice'

// describe('saveKeysInKeychainSaga', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//   })

//   it('serializes key payloads before saving them to the iOS keychain', async () => {
//     const payload = {
//       keys: [
//         { keyName: 'quiet_team_secret', key: 'secret-key' },
//         { keyName: 'quiet_user_public', key: 'public-key' },
//       ],
//     }

//     await expectSaga(saveKeysInKeychainSaga, channelMetadataActions.saveKeysInKeychain(payload))
//       .call(
//         NativeModules.CommunicationModule.saveKeysInKeychain,
//         payload.keys.map(key => JSON.stringify(key))
//       )
//       .run()
//   })
// })
