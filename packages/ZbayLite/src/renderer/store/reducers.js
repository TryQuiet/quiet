import { combineReducers } from 'redux-immutable'

import identityHandlers from './handlers/identity'
import channelHandlers from './handlers/channel'
import nodeHandlers from './handlers/node'
import ratesHandlers from './handlers/rates'
import vaultHandlers from './handlers/vault'
import vaultCreatorHandlers from './handlers/vaultCreator'
import vaultUnlockerHandlers from './handlers/vaultUnlocker'

export default combineReducers({
  identity: identityHandlers.reducer,
  rates: ratesHandlers.reducer,
  channel: channelHandlers.reducer,
  node: nodeHandlers.reducer,
  vault: vaultHandlers.reducer,
  vaultCreator: vaultCreatorHandlers.reducer,
  vaultUnlocker: vaultUnlockerHandlers.reducer
})
