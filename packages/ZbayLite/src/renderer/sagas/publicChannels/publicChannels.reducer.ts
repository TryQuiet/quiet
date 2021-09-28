// import { createAction } from '@reduxjs/toolkit'

// import { ActionsType, Socket } from '../const/actionsTypes'
// import { DisplayableMessage } from '../../zbay/messages.types'

// export type PublicChannelsActions = ActionsType<typeof publicChannelsActions>
// export interface BasicMessage {
//   channelId: string
//   type: number
//   signature: string
//   createdAt: number
//   message: string
//   id: string
//   pubKey: string
//   sender?: {
//     replyTo: string
//     username: string
//   }
// }
// export interface Libp2pMessage {
//   channelAddress: string
//   message: BasicMessage
// }

// interface IChannelInfo {
//   address: string
//   name: string
//   description: string
//   owner: string
//   timestamp: number
//   keys: { ivk?: string; sk?: string }
// }

// export interface IChannelInfoResponse {
//   [name: string]: IChannelInfo
// }

// export const publicChannelsActions = {
//   sendMessage: createAction(Socket.SEND_MESSAGE),
//   loadMessage: createAction<Libp2pMessage, Socket.MESSAGE>(Socket.MESSAGE),
//   loadAllMessages: createAction<string, Socket.FETCH_ALL_MESSAGES>(Socket.FETCH_ALL_MESSAGES),
//   responseLoadAllMessages: createAction<
//   {
//     channelAddress: string
//     messages: any[]
//   },
//   Socket.RESPONSE_FETCH_ALL_MESSAGES
//   >(Socket.RESPONSE_FETCH_ALL_MESSAGES),
//   subscribeForTopic: createAction<IChannelInfo, Socket.SUBSCRIBE_FOR_TOPIC>(
//     Socket.SUBSCRIBE_FOR_TOPIC
//   ),
//   getPublicChannels: createAction(Socket.GET_PUBLIC_CHANNELS),
//   responseGetPublicChannels: createAction<
//   IChannelInfoResponse,
//   Socket.RESPONSE_GET_PUBLIC_CHANNELS
//   >(Socket.RESPONSE_GET_PUBLIC_CHANNELS),
//   addMessage: createAction<
//   {
//     key: string
//     message: { [key: string]: DisplayableMessage }
//   },
//   'ADD_MESSAGE'
//   >('ADD_MESSAGE'),
//   setMessages: createAction<
//   {
//     messages: DisplayableMessage[]
//     contactAddress: string
//     username: string
//     key: string
//   },
//   'SET_DIRECT_MESSAGES'
//   >('SET_DIRECT_MESSAGES'),
//   askForMessages: createAction<{channelAddress: string; ids: string[]}, Socket.ASK_FOR_MESSAGES>(Socket.ASK_FOR_MESSAGES),
//   sendIds: createAction<{channelAddress: string; ids: string[]}, Socket.SEND_IDS>(Socket.SEND_IDS)
// }
