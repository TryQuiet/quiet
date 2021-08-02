import { all as effectsAll, takeEvery } from 'redux-saga/effects'
import { put, select, call } from 'typed-redux-saga'
import { publicChannelsActions, PublicChannelsActions } from './publicChannels.reducer'
import { setPublicChannels } from '../../store/handlers/publicChannels'
import contactsHandlers, { actions } from '../../store/handlers/contacts'
import { displayDirectMessageNotification, displayMessageNotification } from '../../notifications'
import usersSelectors from '../../store/selectors/users'

import { findNewMessages } from '../../store/handlers/messages'

import contactsSelectors from '../../store/selectors/contacts'
import publicChannelsSelectors from '../../store/selectors/publicChannels'
import electronStore from '../../../shared/electronStore'
import debug from 'debug'
import { DisplayableMessage } from '../../zbay/messages.types'

const log = Object.assign(debug('zbay:channels'), {
  error: debug('zbay:channels:err')
})

const all: any = effectsAll

export function* loadMessage(action: PublicChannelsActions['loadMessage']): Generator {
  const message = action.payload.message
  const myUser = yield* select(usersSelectors.myUser)

  const messagesWithInfo = yield* select(contactsSelectors.messagesOfChannelWithUserInfo)

  let foundMessage
  if (message !== null) {
    foundMessage = messagesWithInfo.find((item) => {
      return item.message.id === message.id
    })
  }

  if (foundMessage && myUser.nickname !== foundMessage.userInfo.username) { ///
    yield* call(displayDirectMessageNotification, {
      username: foundMessage.userInfo.username,
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
      message: { [message.id]: message as DisplayableMessage }
    })
  )
}

export function* getPublicChannels(
  action: PublicChannelsActions['responseGetPublicChannels']
): Generator {
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
  const channel = yield* select(contactsSelectors.contact(action.payload.channelAddress))
  if (!channel) {
    log(`Couldn't load all messages. No channel ${action.payload.channelAddress} in contacts`)
    return
  }

  const { username } = channel
  if (!username) {
    return
  }
  const displayableMessages = action.payload.messages

  const messagesById = {}
  action.payload.messages.map(msg => {
    messagesById[msg.id] = msg
  })

  yield put(
    contactsHandlers.actions.setChannelMessages({
      key: action.payload.channelAddress,
      username: username,
      contactAddress: action.payload.channelAddress,
      messages: messagesById
    })
  )

  const state = yield* select()
  const newMsgs = findNewMessages(action.payload.channelAddress, displayableMessages, state)

  const messagesWithInfo = yield* select(contactsSelectors.allMessagesOfChannelsWithUserInfo)
  const msg = newMsgs[newMsgs.length - 1]

  let foundMessage
  if (msg) {
    foundMessage = messagesWithInfo.flat().find((item) => {
      return item.message.id === msg.id
    })
  }

  const myUser = yield* select(usersSelectors.myUser)
  const pubChannels = yield* select(publicChannelsSelectors.publicChannels)

  const pubChannelsArray = Object.values(pubChannels)
  const contact = pubChannelsArray.filter(item => {
    return item.name === username
  })

  if (foundMessage && foundMessage.userInfo.username !== myUser.nickname) {
    yield* call(
      displayMessageNotification, {
        senderName: foundMessage.userInfo.username,
        message: msg.message,
        channelName: username,
        address: contact[0].address
      })
  }

  yield put(
    actions.appendNewMessages({
      contactAddress: action.payload.channelAddress,
      messagesIds: newMsgs
    })
  )
}

export function* sendIds(action: PublicChannelsActions['sendIds']): Generator {
  const channel = yield* select(contactsSelectors.contact(action.payload.channelAddress))
  if (!channel) {
    log(`Couldn't load all messages. No channel ${action.payload.channelAddress} in contacts`)
    return
  }
  let messagesToFetch = []
  const ids = Array.from(Object.values(channel.messages)).map(msg => msg.id)
  messagesToFetch = action.payload.ids.filter(id => !ids.includes(id))
  yield put(
    publicChannelsActions.askForMessages({
      channelAddress: action.payload.channelAddress,
      ids: messagesToFetch
    })
  )
}

export function* publicChannelsSaga(): Generator {
  yield all([
    takeEvery(`${publicChannelsActions.loadMessage}`, loadMessage),
    takeEvery(`${publicChannelsActions.responseLoadAllMessages}`, loadAllMessages),
    takeEvery(`${publicChannelsActions.responseGetPublicChannels}`, getPublicChannels),
    takeEvery(`${publicChannelsActions.sendIds}`, sendIds)
  ])
}
