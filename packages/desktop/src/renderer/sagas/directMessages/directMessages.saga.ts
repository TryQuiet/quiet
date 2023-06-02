// import { all as effectsAll, takeEvery } from 'redux-saga/effects'
// import { put, select, call } from 'typed-redux-saga'
// import { directMessagesActions, DirectMessagesActions } from './directMessages.reducer'
// import directMessagesSelectors from '../../store/selectors/directMessages'
// import usersSelectors from '../../store/selectors/users'
// import contactsSelectors from '../../store/selectors/contacts'
// import contactsHandlers, { actions as contactsActions } from '../../store/handlers/contacts'

// import { actions } from '../../store/handlers/directMessages'
// import { displayDirectMessageNotification } from '../../notifications'

// import { checkConversation, decodeMessage } from '../../cryptography/cryptography'
// import debug from 'debug'
// const log = Object.assign(debug('zbay:dm'), {
//   error: debug('zbay:dm:err')
// })

// const all: any = effectsAll

// export function* loadDirectMessage(action: DirectMessagesActions['loadDirectMessage']): Generator {
//   const conversations = yield* select(directMessagesSelectors.conversations)
//   const conversation = Array.from(Object.values(conversations)).filter(conv => {
//     return conv.conversationId === action.payload.channelId
//   })

//   const contact = conversation[0]
//   const contactPublicKey = contact.contactPublicKey
//   const channel = yield* select(contactsSelectors.contact(contactPublicKey))
//   const sharedSecret = conversation[0].sharedSecret
//   const msg = JSON.stringify(action.payload.message)
//   const decodedMessage = decodeMessage(sharedSecret, msg)
//   const message = JSON.parse(decodedMessage)

//   const messageId = Array.from(Object.keys(channel.messages)).length

//   const myUser = yield* select(usersSelectors.myUser)

//   const messagesWithInfo = yield* select(contactsSelectors.messagesOfChannelWithUserInfo)

//   let foundMessage
//   if (message !== null) {
//     foundMessage = messagesWithInfo.find((item) => {
//       return item.message.id === message.id
//     })
//   }

//   if (myUser.nickname !== message.sender.username) {
//     yield call(displayDirectMessageNotification, {
//       username: foundMessage.userInfo.username,
//       message: message
//     })
//     yield put(
//       contactsActions.appendNewMessages({
//         contactAddress: contactPublicKey,
//         messagesIds: [message.id]
//       })
//     )
//   }

//   yield put(
//     directMessagesActions.addDirectMessage({
//       key: contactPublicKey,
//       message: { [messageId]: message }
//     })
//   )
// }

// export function* loadAllDirectMessages(
//   action: DirectMessagesActions['responseLoadAllDirectMessages']
// ): Generator {
//   const conversations = yield* select(directMessagesSelectors.conversations)
//   const conversation = Array.from(Object.values(conversations)).filter(conv => {
//     return conv.conversationId === action.payload.channelId
//   })
//   const contact = conversation[0]
//   const contactPublicKey = contact.contactPublicKey
//   const sharedSecret = contact.sharedSecret
//   let user = yield* select(directMessagesSelectors.userByPublicKey(contactPublicKey))
//   if (!user) {
//     user = yield* select(directMessagesSelectors.user(contactPublicKey))
//   }
//   if (!user) return
//   const channel = yield* select(contactsSelectors.contact(user.nickname))

//   if (!channel) {
//     log.error(`Couldn't load all messages. No channel ${action.payload.channelId} in contacts`)
//     return
//   }

//   const { username } = channel
//   let newMessages = []
//   const ids = Array.from(Object.keys(channel.messages))
//   newMessages = action.payload.messages.filter(id => !ids.includes(id))

//   const displayableMessages = {}
//   if (username && newMessages) {
//     let latestMessage = null
//     newMessages.map(msg => {
//       const decodedMessage = JSON.parse(decodeMessage(sharedSecret, JSON.stringify(msg)))
//       displayableMessages[msg] = decodedMessage
//       latestMessage = decodedMessage
//     })
//     yield* put(
//       contactsHandlers.actions.setMessages({
//         key: contactPublicKey,
//         username: username,
//         contactAddress: contactPublicKey,
//         messages: displayableMessages
//       })
//     )
//     const myUser = yield* select(usersSelectors.myUser)

//     let messageSender = null
//     if (latestMessage) {
//       messageSender = yield* select(directMessagesSelectors.userByPublicKey(latestMessage.pubKey))
//     }

//     if (latestMessage && (messageSender?.nickname !== myUser.nickname) && (messageSender?.nickname !== channel.username)) {
//       yield* call(displayDirectMessageNotification, {
//         username: username,
//         message: latestMessage
//       })
//     }

//     yield put(
//       contactsActions.appendNewMessages({
//         contactAddress: username,
//         messagesIds: Array.from(Object.keys(displayableMessages))
//       })
//     )
//   }
// }

// export function* responseGetPrivateConversations(
//   action: DirectMessagesActions['responseGetPrivateConversations']
// ): Generator {
//   const privKey = yield* select(directMessagesSelectors.privateKey)
//   const contacts = yield* select(contactsSelectors.contacts)
//   const conversationsList = yield* select(directMessagesSelectors.conversationsList)
//   const exisitngConversations = Array.from(Object.keys(conversationsList))
//   for (const [key, value] of Object.entries(action.payload)) {
//     if (exisitngConversations.includes(key)) continue

//     const conversation = checkConversation(key, value, privKey)

//     if (conversation) {
//       const user = yield* select(directMessagesSelectors.userByPublicKey(conversation.contactPublicKey))
//       if (!contacts[user.nickname]) {
//         yield put(
//           contactsActions.addDirectContact({
//             key: conversation.contactPublicKey,
//             username: user.nickname,
//             contactAddress: ''
//           })
//         )
//       }
//       yield put(actions.addConversation(conversation))
//       yield put(directMessagesActions.subscribeToDirectMessageThread(conversation.conversationId))
//     }

//     yield put(
//       actions.fetchConversations({
//         conversationsList: {
//           [key]: value
//         }
//       })
//     )
//   }
// }

// export function* directMessagesSaga(): Generator {
//   yield all([
//     takeEvery(
//       `${directMessagesActions.responseGetPrivateConversations}`,
//       responseGetPrivateConversations
//     ),
//     takeEvery(`${directMessagesActions.responseLoadAllDirectMessages}`, loadAllDirectMessages),
//     takeEvery(`${directMessagesActions.responseLoadDirectMessage}`, loadDirectMessage)
//   ])
// }
