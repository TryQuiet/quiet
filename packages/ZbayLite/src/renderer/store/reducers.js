import { combineReducers } from 'redux-immutable'

import vaultHandlers from './handlers/vault'
import vaultCreatorHandlers from './handlers/vaultCreator'
import vaultUnlockerHandlers from './handlers/vaultUnlocker'

export default combineReducers({
  vault: vaultHandlers.reducer,
  vaultCreator: vaultCreatorHandlers.reducer,
  vaultUnlocker: vaultUnlockerHandlers.reducer
})
