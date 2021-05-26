import { all as effectsAll, takeEvery } from 'redux-saga/effects'
import { put, select } from 'typed-redux-saga'
import BigNumber from 'bignumber.js'
import { publicChannelsActions, PublicChannelsActions } from './publicChannels.reducer'
import { displayDirectMessageNotification, displayMessageNotification } from '../../notifications'
import { setPublicChannels } from '../../store/handlers/publicChannels'
import contactsHandlers, { actions } from '../../store/handlers/contacts'
import {
  getPublicKeysFromSignature,
  usernameSchema,
  exchangeParticipant
} from '../../zbay/messages'
import { findNewMessages } from '../../store/handlers/messages'

import usersSelectors from '../../store/selectors/users'
import contactsSelectors from '../../store/selectors/contacts'
import { DisplayableMessage } from '../../zbay/messages.types'
import publicChannelsSelectors from '../../store/selectors/publicChannels'
import electronStore from '../../../shared/electronStore'
import debug from 'debug'

const log = Object.assign(debug('zbay:channels'), {
  error: debug('zbay:channels:err')
})

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

export function* loadMessage(action: PublicChannelsActions['loadMessage']): Generator {
  const users = yield* select(usersSelectors.users)
  const myUser = yield* select(usersSelectors.myUser)
  const message = transferToMessage(action.payload.message, users)
  if (myUser.nickname !== message.sender.username) {
    displayDirectMessageNotification({
      username: message.sender.username,
      message: message
    })
    yield put(
      actions.appendNewMessages({
        contactAddress: action.payload.channelAddress,
        messagesIds: [message.id]
      })
    )
  }
  yield put(
    publicChannelsActions.addMessage({
      key: action.payload.channelAddress,
      message: { [message.id]: message }
    })
  )
}

export function* getPublicChannels(action: PublicChannelsActions['responseGetPublicChannels']): Generator {
  if (action.payload) {
    yield put(setPublicChannels(action.payload))

    const mainChannel = yield* select(publicChannelsSelectors.publicChannelsByName('zbay'))
    if (mainChannel && !electronStore.get('generalChannelInitialized')) {
      yield put(
        contactsHandlers.actions.addContact({
          key: mainChannel.address,
          contactAddress: mainChannel.address,
          username: mainChannel.name
        })
      )
      yield put(publicChannelsActions.subscribeForTopic(mainChannel))
      electronStore.set('generalChannelInitialized', true)
    }
  }
}

export function* loadAllMessages(
  action: PublicChannelsActions['responseLoadAllMessages']
): Generator {
  const users = yield* select(usersSelectors.users)
  const myUser = yield* select(usersSelectors.myUser)
  const pubChannels = yield* select(publicChannelsSelectors.publicChannels)

  const channel = yield* select(contactsSelectors.contact(action.payload.channelAddress))
  if (!channel) {
    log(`Couldn't load all messages. No channel ${action.payload.channelAddress} in contacts`)
    return
  }

  const { username } = channel
  if (!username) {
    return
  }
  const displayableMessages = action.payload.messages.map(msg => transferToMessage(msg, users))
  yield put(
    contactsHandlers.actions.setAllMessages({
      key: action.payload.channelAddress,
      username: username,
      contactAddress: action.payload.channelAddress,
      messages: displayableMessages
    })
  )
  const state = yield* select()
  const newMsgs = findNewMessages(action.payload.channelAddress, displayableMessages, state)
  const pubChannelsArray = Object.values(pubChannels)
  const contact = pubChannelsArray.filter((item) => {
    return item.name === username
  })
  console.log(`New messages are ${newMsgs}`)
  const msg = newMsgs[newMsgs.length - 1]
  console.log(`MSG IS ${msg}`)
  if (msg && msg?.sender?.username !== myUser.nickname) {
    displayMessageNotification({
      senderName: msg.sender.username,
      message: msg.message,
      channelName: username,
      address: contact[0].address
    })
  }
  // newMsgs.forEach(msg => {
  //   if (newMsgs.length > 0 && msg.sender.replyTo && msg.sender.username !== myUser.nickname) {
  //     displayMessageNotification({
  //       senderName: msg.sender.username,
  //       message: msg.message,
  //       channelName: username,
  //       address: contact[0].address
  //     })
  //   } else if (msg.sender.username !== myUser.nickname) {
  //     displayMessageNotification({
  //       senderName: msg.sender.username,
  //       message: msg.message,
  //       channelName: username,
  //       address: contact[0].address
  //     })
  //   }
  // })
  yield put(
    actions.appendNewMessages({
      contactAddress: action.payload.channelAddress,
      messagesIds: newMsgs
    })
  )
}

export function* publicChannelsSaga(): Generator {
  yield all([
    takeEvery(`${publicChannelsActions.loadMessage}`, loadMessage),
    takeEvery(`${publicChannelsActions.responseLoadAllMessages}`, loadAllMessages),
    takeEvery(`${publicChannelsActions.responseGetPublicChannels}`, getPublicChannels)
  ])
}
