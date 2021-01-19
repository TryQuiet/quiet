import { all as effectsAll, takeEvery } from 'redux-saga/effects'
import { put, select } from 'typed-redux-saga'
import BigNumber from 'bignumber.js'
import { publicChannelsActions, PublicChannelsActions } from './publicChannels.reducer'
import { displayDirectMessageNotification, displayMessageNotification } from '../../notifications'
// import { socketsActions } from '../socket/socket.saga.reducer'
import {
  getPublicKeysFromSignature,
  usernameSchema,
  exchangeParticipant
} from '../../zbay/messages'
import { findNewMessages } from '../../store/handlers/messages'
import { actions } from '../../store/handlers/contacts'
import usersSelectors from '../../store/selectors/users'
import { DisplayableMessage } from '../../zbay/messages.types'
import electronStore from '../../../shared/electronStore'

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
  const message = transferToMessage(action.payload.message, users)
  displayDirectMessageNotification({
    username: message.sender.username,
    message: message
  })
  yield put(
    publicChannelsActions.addMessage({
      key: action.payload.channelAddress,
      message: { [message.id]: message }
    })
  )
  yield put(
    actions.appendNewMessages({
      contactAddress: action.payload.channelAddress,
      messagesIds: [message.id]
    })
  )
}

export function* loadAllMessages(
  action: PublicChannelsActions['responseLoadAllMessages']
): Generator {
  const users = yield* select(usersSelectors.users)
  const importedChannels = electronStore.get('importedChannels')
  const { name } = importedChannels[action.payload.channelAddress]
  if (name) {
    const displayableMessages = action.payload.messages.map(msg => transferToMessage(msg, users))
    console.log(displayableMessages)
    for (const msg of displayableMessages) {
      yield put(
        publicChannelsActions.addMessage({
          key: action.payload.channelAddress,
          message: { [msg.id]: msg }
        })
      )
    }
    const state = yield* select()
    const newMsgs = findNewMessages(action.payload.channelAddress, displayableMessages, state)
    console.log('new messages', newMsgs)
    newMsgs.forEach(msg => {
      displayMessageNotification({
        senderName: msg.sender.username,
        message: msg.message,
        channelName: name
      })
    })
    yield put(
      actions.appendNewMessages({
        contactAddress: action.payload.channelAddress,
        messagesIds: newMsgs
      })
    )
  }
}

export function* publicChannelsSaga(): Generator {
  yield all([
    takeEvery(`${publicChannelsActions.loadMessage}`, loadMessage),
    takeEvery(`${publicChannelsActions.responseLoadAllMessages}`, loadAllMessages)
  ])
}
