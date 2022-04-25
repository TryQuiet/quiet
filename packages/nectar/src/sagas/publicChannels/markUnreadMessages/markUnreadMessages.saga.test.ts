// import { setupCrypto } from '@quiet/identity'
// import { Store } from '../../store.types'
// import { getFactory, Community, ChannelMessage, MessageType } from '../../..'
// import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
// import { expectSaga } from 'redux-saga-test-plan'
// import { publicChannelsActions } from '../publicChannels.slice'
// import { communitiesActions } from '../../communities/communities.slice'
// import { FactoryGirl } from 'factory-girl'
// import { combineReducers } from 'redux'
// import { Identity } from '../../identity/identity.types'
// import { identityActions } from '../../identity/identity.slice'
// import { DateTime } from 'luxon'

// describe('markUnreadMessagesSaga', () => {
//   let store: Store
//   let factory: FactoryGirl

//   let community: Community
//   let alice: Identity

//   beforeAll(async () => {
//     setupCrypto()

//     store = prepareStore().store

//     factory = await getFactory(store)

//     community = await factory.create<
//     ReturnType<typeof communitiesActions.addNewCommunity>['payload']
//     >('Community')

//     alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
//       'Identity',
//       { id: community.id, nickname: 'alice' }
//     )

//     const channelNames = ['memes', 'pets', 'travels']

//     // Automatically create channels
//     for (const name of channelNames) {
//       await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
//         'PublicChannel',
//         {
//           communityId: community.id,
//           channel: {
//             name: name,
//             description: `Welcome to #${name}`,
//             timestamp: DateTime.utc().valueOf(),
//             owner: alice.nickname,
//             address: name
//           }
//         }
//       )
//     }
//   })

//   test('mark unread messages', async () => {
//     const messagesAddresses = ['general', 'memes', 'memes', 'travels']
//     const messages: ChannelMessage[] = []

//     // Automatically create messages
//     for (const address of messagesAddresses) {
//       const message = (
//         await factory.build<typeof publicChannelsActions.test_message>('Message', {
//           identity: alice,
//           message: {
//             id: Math.random().toString(36).substr(2.9),
//             type: MessageType.Basic,
//             message: 'message',
//             createdAt: DateTime.utc().valueOf(),
//             channelAddress: address,
//             signature: '',
//             pubKey: ''
//           },
//           verifyAutomatically: true
//         })
//       ).payload.message
//       messages.push(message)
//     }

//     const reducer = combineReducers(reducers)
//     await expectSaga(
//       markUnreadMessagesSaga,
//       publicChannelsActions.incomingMessages({
//         messages: messages,
//         communityId: community.id
//       })
//     )
//       .withReducer(reducer)
//       .withState(store.getState())
//       .put(
//         publicChannelsActions.markUnreadMessages({
//           messages: [
//             {
//               id: messages[1].id,
//               channelAddress: 'memes'
//             },
//             {
//               id: messages[2].id,
//               channelAddress: 'memes'
//             },
//             {
//               id: messages[3].id,
//               channelAddress: 'travels'
//             }
//           ],
//           communityId: community.id
//         })
//       )
//       .run()
//   })
// })
