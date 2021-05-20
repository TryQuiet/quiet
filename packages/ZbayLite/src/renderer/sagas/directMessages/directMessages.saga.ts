import { all as effectsAll, takeEvery } from 'redux-saga/effects'
import { put, select, call } from 'typed-redux-saga'
import { directMessagesActions, DirectMessagesActions } from './directMessages.reducer'
import {
  getPublicKeysFromSignature,
  usernameSchema,
  exchangeParticipant
} from '../../zbay/messages'
import directMessagesSelectors from '../../store/selectors/directMessages'
import usersSelectors from '../../store/selectors/users'
import contactsSelectors from '../../store/selectors/contacts'
import channelSelectors from '../../store/selectors/channel'
import { findNewMessages } from '../../store/handlers/messages'
import contactsHandlers, { actions as contactsActions } from '../../store/handlers/contacts'
import { DisplayableMessage } from '../../zbay/messages.types'
import { displayDirectMessageNotification } from '../../notifications'
import BigNumber from 'bignumber.js'
import { actions } from '../../store/handlers/directMessages'

import { checkConversation, decodeMessage } from '../../cryptography/cryptography'

const all: any = effectsAll

export const transferToMessage = (msg, users) => {
  let publicKey = null
  let sender = { replyTo: '', username: 'Unnamed' }
  let isUnregistered = false
  const { r, message, signature, id, type, createdAt } = msg
  const signatureBuffer = Buffer.from(signature, 'base64')
  publicKey = getPublicKeysFromSignature({
    message,
    signature: signatureBuffer,
    r
  }).toString('hex')
  if (users !== undefined) {
    const fromUser = users[publicKey]
    if (fromUser !== undefined) {
      const isUsernameValid = usernameSchema.isValidSync(fromUser)
      sender = {
        ...exchangeParticipant,
        replyTo: fromUser.address,
        username: isUsernameValid ? fromUser.nickname : `anon${publicKey.substring(0, 10)}`
      }
    } else {
      sender = {
        ...exchangeParticipant,
        replyTo: '',
        username: `anon${publicKey}`
      }
      isUnregistered = true
    }
  }
  const parsedMessage: any = {
    id: id,
    message,
    r,
    type,
    createdAt,
    spent: new BigNumber(0),
    sender: sender,
    isUnregistered,
    publicKey,
    blockHeight: null
  }
  const displayableMessage = new DisplayableMessage(parsedMessage)
  return displayableMessage
}

export function* loadDirectMessage(action: DirectMessagesActions['loadDirectMessage']): Generator {
  const conversations = yield* select(directMessagesSelectors.conversations)
  const conversation = Array.from(Object.values(conversations)).filter(conv => {
    return conv.conversationId === action.payload.channelAddress
  })

  const contact = conversation[0]
  const contactPublicKey = contact.contactPublicKey
  const channel = yield* select(contactsSelectors.contact(contactPublicKey))
  const users = yield* select(usersSelectors.users)
  const myUser = yield* select(usersSelectors.myUser)
  const { id } = yield* select(channelSelectors.channel)
  const sharedSecret = conversation[0].sharedSecret
  const msg = JSON.stringify(action.payload.message)
  const decodedMessage = decodeMessage(sharedSecret, msg)
  const message = transferToMessage(JSON.parse(decodedMessage), users)

  const messageId = Array.from(Object.keys(channel.messages)).length
  if (myUser.nickname !== message.sender.username) {
    yield call(displayDirectMessageNotification, {
      username: message.sender.username,
      message: message
    })
    yield put(
      contactsActions.appendNewMessages({
        contactAddress: contactPublicKey,
        messagesIds: [message.id]
      })
    )
  }
  yield put(
    directMessagesActions.addDirectMessage({
      key: contactPublicKey,
      message: { [messageId]: message }
    })
  )
}

export function* loadAllDirectMessages(
  action: DirectMessagesActions['responseLoadAllDirectMessages']
): Generator {
  console.log('SAGA: DirectMessages - loadAllDirectMessages Entered')
  console.log(`SAGA: DirectMessages - loadAllDirectMessages action.payload.channelAddress is ${action.payload.channelAddress}`)
  console.log(`SAGA: DirectMessages - loadAllDirectMessages action.payload.messages length is ${action.payload.messages.length}`)
  const conversations = yield* select(directMessagesSelectors.conversations)
  console.log(`SAGA: DirectMessages - loadAllDirectMessages conversations is ${conversations}`)
  const conversation = Array.from(Object.values(conversations)).filter(conv => {
    console.log(`convers ${conv.conversationId} and bombers ${action.payload.channelAddress}`)
    return conv.conversationId === action.payload.channelAddress
  })
  console.log(`SAGA: DirectMessages - loadAllDirectMessages conversations is ${conversations}`)
  const contact = conversation[0]
  console.log(`SAGA: DirectMessages - loadAllDirectMessages conversations is ${conversations}`)
  const contactPublicKey = contact.contactPublicKey
  const sharedSecret = contact.sharedSecret
  const users = yield* select(usersSelectors.users)
  const myUser = yield* select(usersSelectors.myUser)
  const channel = yield* select(contactsSelectors.contact(contactPublicKey))
  if (!channel) {
    console.log(
      `Couldn't load all messages. No channel ${action.payload.channelAddress} in contacts`
    )
    return
  }

  const { username } = channel
  if (username) {
    const decodedMessages = action.payload.messages.map(msg => {
      const message = JSON.stringify(msg)
      return JSON.parse(decodeMessage(sharedSecret, message))
    })
    const displayableMessages = decodedMessages.map(msg => transferToMessage(msg, users))
    const state = yield* select()
    const newMsgs = findNewMessages(contactPublicKey, displayableMessages, state, true)
    yield put(
      contactsHandlers.actions.setMessages({
        key: contactPublicKey,
        username: username,
        contactAddress: contactPublicKey,
        messages: displayableMessages
      })
    )

console.log(`nes messages are ${newMsgs}`)

    const latestMessage = newMsgs[newMsgs.length - 1]

    if (latestMessage && latestMessage.sender.username !== myUser.nickname) {
      yield call(displayDirectMessageNotification, {
        username: latestMessage.sender.username,
        message: latestMessage
      })
    }

    yield put(
      contactsActions.appendNewMessages({
        contactAddress: contactPublicKey,
        messagesIds: newMsgs
      })
    )
  }
  console.log('SAGA: DirectMessages - loadAllDirectMessages Finished')
}

export function* responseGetAvailableUsers(
  action: DirectMessagesActions['responseGetAvailableUsers']
): Generator {
  for (const [key, value] of Object.entries(action.payload)) {
    const user = yield* select(usersSelectors.registeredUser(key))

    yield put(
      actions.fetchUsers({
        usersList: {
          [key]: {
            publicKey: key,
            halfKey: value.halfKey,
            nickname: user?.nickname || `anon${key.substring(0, 8)}`
          }
        }
      })
    )
  }
}

export function* responseGetPrivateConversations(
  action: DirectMessagesActions['responseGetPrivateConversations']
): Generator {
  const privKey = yield* select(directMessagesSelectors.privateKey)
  const contacts = yield* select(contactsSelectors.contacts)
  for (const [key, value] of Object.entries(action.payload)) {
    const conversation = checkConversation(key, value, privKey)

    if (conversation) {
      console.log('JSUT DECODED CONVERSATION, NOW SUBSCRIBING TO IT')
      const user = yield* select(usersSelectors.registeredUser(conversation.contactPublicKey))
        if(!contacts[conversation.contactPublicKey]) {
          yield put(
            contactsActions.addContact({
              key: conversation.contactPublicKey,
              username: user?.nickname || `anon${conversation.contactPublicKey.substring(0, 8)}`,
              contactAddress: user?.address || ''
            })
            )
          }
      yield put(directMessagesActions.subscribeForDirectMessageThread(conversation.conversationId))
      yield put(actions.addConversation(conversation))
    }

    yield put(
      actions.fetchConversations({
        conversationsList: {
          [key]: value
        }
      })
    )
  }
}

export function* directMessagesSaga(): Generator {
  yield all([
    takeEvery(`${directMessagesActions.responseGetAvailableUsers}`, responseGetAvailableUsers),
    takeEvery(
      `${directMessagesActions.responseGetPrivateConversations}`,
      responseGetPrivateConversations
    ),
    takeEvery(`${directMessagesActions.responseLoadAllDirectMessages}`, loadAllDirectMessages),
    takeEvery(`${directMessagesActions.responseLoadDirectMessage}`, loadDirectMessage)
  ])
}
