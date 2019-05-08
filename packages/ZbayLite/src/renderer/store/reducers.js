import { combineReducers } from 'redux-immutable'

import identityHandlers from './handlers/identity'
import notificationsHandlers from './handlers/notifications'
import importedChannelHandlers from './handlers/importedChannel'
import channelHandlers from './handlers/channel'
import channelsHandlers from './handlers/channels'
import nodeHandlers from './handlers/node'
import ratesHandlers from './handlers/rates'
import vaultHandlers from './handlers/vault'
import vaultCreatorHandlers from './handlers/vaultCreator'
import vaultUnlockerHandlers from './handlers/vaultUnlocker'

export default combineReducers({
  identity: identityHandlers.reducer,
  notifications: notificationsHandlers.reducer,
  importedChannel: importedChannelHandlers.reducer,
  rates: ratesHandlers.reducer,
  channel: channelHandlers.reducer,
  channels: channelsHandlers.reducer,
  node: nodeHandlers.reducer,
  vault: vaultHandlers.reducer,
  vaultCreator: vaultCreatorHandlers.reducer,
  vaultUnlocker: vaultUnlockerHandlers.reducer
})
