import { combineReducers } from 'redux-immutable'

import identityHandlers from './handlers/identity'
import notificationsHandlers from './handlers/notifications'
import importedChannelHandlers from './handlers/importedChannel'
import channelHandlers from './handlers/channel'
import channelsHandlers from './handlers/channels'
import nodeHandlers from './handlers/node'
import ratesHandlers from './handlers/rates'
import vaultHandlers from './handlers/vault'
import modalsHandlers from './handlers/modals'
import operationsHandlers from './handlers/operations'
import messagesQueueHandlers from './handlers/messagesQueue'
import directMessagesQueueHandlers from './handlers/directMessagesQueue'
import criticalErrorHandlers from './handlers/criticalError'
import appHandlers from './handlers/app'
import messagesHandlers from './handlers/messages'
import usersHandlers from './handlers/users'
import contactsHandlers from './handlers/contacts'
import directMessageChannelHandlers from './handlers/directMessageChannel'
import invitationHandlers from './handlers/invitation'
import coordinatorHandlers from './handlers/coordinator'

export default combineReducers({
  messages: messagesHandlers.reducer,
  users: usersHandlers.reducer,
  app: appHandlers.reducer,
  operations: operationsHandlers.reducer,
  messagesQueue: messagesQueueHandlers.reducer,
  directMessagesQueue: directMessagesQueueHandlers.reducer,
  modals: modalsHandlers.reducer,
  identity: identityHandlers.reducer,
  notifications: notificationsHandlers.reducer,
  importedChannel: importedChannelHandlers.reducer,
  rates: ratesHandlers.reducer,
  channel: channelHandlers.reducer,
  channels: channelsHandlers.reducer,
  node: nodeHandlers.reducer,
  vault: vaultHandlers.reducer,
  criticalError: criticalErrorHandlers.reducer,
  contacts: contactsHandlers.reducer,
  directMessageChannel: directMessageChannelHandlers.reducer,
  invitation: invitationHandlers.reducer,
  coordinator: coordinatorHandlers.reducer
})
