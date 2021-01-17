import { all as effectsAll, takeEvery } from 'redux-saga/effects'
import { put, select } from 'typed-redux-saga'
import BigNumber from 'bignumber.js'
import { publicChannelsActions, PublicChannelsActions } from './publicChannels.reducer'
// import { socketsActions } from '../socket/socket.saga.reducer'
import {
  getPublicKeysFromSignature,
  usernameSchema,
  exchangeParticipant
} from '../../zbay/messages'
import usersSelectors from '../../store/selectors/users'
import { DisplayableMessage } from '../../zbay/messages.types'
import electronStore from '../../../shared/electronStore'

const all: any = effectsAll

const transferToMessage = (msg, users) => {
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
  yield put(
    publicChannelsActions.addMessage({
      key: action.payload.channelAddress,
      message: { [message.id]: message }
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
    yield put(
      publicChannelsActions.setMessages({
        key: action.payload.channelAddress,
        contactAddress: action.payload.channelAddress,
        username: name,
        messages: displayableMessages
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

// contactsHandlers.actions.setMessages({
//   key: channel.address,
//   contactAddress: channel.address,
//   username: channel.name,
//   messages: messagesAll
//     .filter(msg => msg.id !== null)
//     .reduce((acc, cur) => {
//       acc[cur.id] = cur
//       return acc
//     }, [])
//
