import Immutable from 'immutable'
import { createAction } from 'redux-actions'
import channelSelectors from '../selectors/channel'
import usersSelectors from '../selectors/users'
import identitySelectors from '../selectors/identity'

import {
  messageType,
  actionTypes,
  notificationFilterType
} from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages.types'
import electronStore from '../../../shared/electronStore'
import notificationCenterSelectors from '../selectors/notificationCenter'

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

const msgTypeToNotification = new Set([
  messageType.BASIC,
  messageType.ITEM_TRANSFER,
  messageType.ITEM_BASIC,
  messageType.TRANSFER
])

export const findNewMessages = (key, messages, state, isDM = false) => {
  console.log('entered find messages')
  if (messages) {
    console.log('findNewMessagses: 1')
    const currentChannel = channelSelectors.channel(state)
    if (key === currentChannel.id) {
      console.log('findNewMessagses: 2')
      return []
    }
    const userFilter = notificationCenterSelectors.userFilterType(state)
    const channelFilter = notificationCenterSelectors.channelFilterById(key)(state)
    const lastSeen = parseInt(electronStore.get(`lastSeen.${key}`)) || Number.MAX_SAFE_INTEGER
    console.log('findNewMessagses: 3')
    if (
      userFilter === notificationFilterType.NONE ||
      channelFilter === notificationFilterType.NONE
    ) {
      console.log('findNewMessagses: 4')
      return []
    }
    const signerPubKey = identitySelectors.signerPubKey(state)

    const filteredByTimeAndType = messages.filter(
      msg =>
        msg.publicKey !== signerPubKey &&
        msg.createdAt > lastSeen &&
        msgTypeToNotification.has(msg.type)
    )
    console.log(`findNewMessagses: 5 ${filteredByTimeAndType}`)
    if (
      isDM ||
      userFilter === notificationFilterType.MENTIONS ||
      channelFilter === notificationFilterType.MENTIONS
    ) {
      console.log('INSIDE ADDITIONAL IFS')
      const myUser = usersSelectors.myUser(state)
      return filteredByTimeAndType.filter(msg => {
        if (msg.message.itemId) {
          console.log(`First if: ${msg.message.itemId}`)
          console.log(`First if: ${msg.message.text}`)
          return msg.message.text
            ?.split(' ')
            .map(text => text.trim())
            .includes(`@${myUser.nickname}`)
        } else {
          console.log(`if else is ${msg.message}`)
          return msg.message
            ?.split(' ')
            .map(text => text.trim())
        }
      })
    }
    console.log(`findNewMessagses: 6 ${filteredByTimeAndType}`)
    return filteredByTimeAndType
  }
  return []
}

export default {
  actions
}
