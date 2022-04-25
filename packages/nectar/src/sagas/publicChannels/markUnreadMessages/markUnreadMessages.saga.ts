// import { select, put } from 'typed-redux-saga'
// import { PayloadAction } from '@reduxjs/toolkit'
// import { publicChannelsActions } from '../publicChannels.slice'
// import { publicChannelsSelectors } from '../publicChannels.selectors'
// import { communitiesSelectors } from '../../communities/communities.selectors'

// export function* markUnreadMessagesSaga(
//   action: PayloadAction<ReturnType<typeof publicChannelsActions.incomingMessages>['payload']>
// ): Generator {
//   const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
//   const currentChannel = yield* select(publicChannelsSelectors.currentChannelAddress)

//   const messages = action.payload.messages.filter(message => message.channelAddress !== currentChannel)

//   const unread: UnreadChannelMessage[] = messages.map(message => {
//     return {
//       id: message.id,
//       channelAddress: message.channelAddress
//     }
//   })

//   const payload: MarkUnreadMessagesPayload = {
//     messages: unread,
//     communityId: currentCommunity?.id
//   }

//   yield* put(
//     publicChannelsActions.markUnreadMessages(payload)
//   )
// }

// export function* clearUnreadMessagesSaga(
//   _action: PayloadAction<ReturnType<typeof publicChannelsActions.setCurrentChannel>['payload']>
// ): Generator {
//   const { channelAddress, communityId } = action.payload

//   if (channelAddress === '') return

//   const payload: ClearUnreadMessagesPayload = {
//     channelAddress: channelAddress,
//     communityId: communityId
//   }

//   yield* put(
//     publicChannelsActions.clearUnreadMessages(payload)
//   )
// }
