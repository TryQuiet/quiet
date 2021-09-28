import Immutable from 'immutable'
import { createAction } from 'redux-actions'
// import channelSelectors from '../selectors/channel'
// import usersSelectors from '../selectors/users'
// import identitySelectors from '../selectors/identity'

import {
  actionTypes
} from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages.types'
// import electronStore from '../../../shared/electronStore'
// import notificationCenterSelectors from '../selectors/notificationCenter'

export const ChannelMessages = {
  messages: [],
  newMessages: []
}

export const initialState = Immutable.Map()

export interface MessageStore {
  [key: string]: DisplayableMessage
}

const setMessages = createAction(actionTypes.SET_MESSAGES)
const cleanNewMessages = createAction(actionTypes.CLEAN_NEW_MESSAGESS)
const appendNewMessages = createAction(actionTypes.APPEND_NEW_MESSAGES)

export const actions = {
  setMessages,
  cleanNewMessages,
  appendNewMessages
}

// const msgTypeToNotification = new Set([
//   messageType.BASIC,
//   messageType.ITEM_TRANSFER,
//   messageType.ITEM_BASIC,
//   messageType.TRANSFER
// ])

// export const findNewMessages = (key, messages, state, isDM = false) => {
//   if (messages) {
//     const currentChannel = channelSelectors.channel(state)
//     if (key === currentChannel.id) {
//       return []
//     }
//     const userFilter = notificationCenterSelectors.userFilterType(state)
//     const channelFilter = notificationCenterSelectors.channelFilterById(key)(state)
//     const lastSeen = parseInt(electronStore.get(`lastSeen.${key}`)) || Number.MAX_SAFE_INTEGER
//     if (
//       userFilter === notificationFilterType.NONE ||
//       channelFilter === notificationFilterType.NONE
//     ) {
//       return []
//     }
//     const signerPubKey = identitySelectors.signerPubKey(state)

//     const filteredByTimeAndType = messages.filter(
//       msg =>
//         msg.publicKey !== signerPubKey &&
//         msg.createdAt > lastSeen &&
//         msgTypeToNotification.has(msg.type)
//     )
//     if (
//       isDM ||
//       userFilter === notificationFilterType.MENTIONS ||
//       channelFilter === notificationFilterType.MENTIONS
//     ) {
//       const myUser = usersSelectors.myUser(state)
//       return filteredByTimeAndType.filter(msg => {
//         if (msg.message.itemId) {
//           return msg.message.text
//             ?.split(' ')
//             .map(text => text.trim())
//             .includes(`@${myUser.nickname}`)
//         } else {
//           return msg.message
//             ?.split(' ')
//             .map(text => text.trim())
//         }
//       })
//     }
//     return filteredByTimeAndType
//   }
//   return []
// }

export default {
  actions
}
