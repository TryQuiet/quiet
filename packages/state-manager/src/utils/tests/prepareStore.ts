import { combineReducers, createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import { StoreKeys } from '../../sagas/store.keys'
import { connectionReducer } from '../../sagas/appConnection/connection.slice'
import { communitiesReducer } from '../../sagas/communities/communities.slice'
import { errorsReducer } from '../../sagas/errors/errors.slice'
import { identityReducer } from '../../sagas/identity/identity.slice'
import { messagesReducer } from '../../sagas/messages/messages.slice'
import { publicChannelsReducer } from '../../sagas/publicChannels/publicChannels.slice'
import { usersReducer } from '../../sagas/users/users.slice'
import { settingsReducer } from '../../sagas/settings/settings.slice'
import { lastActionReducer } from './helpers'
import { filesReducer } from '../../sagas/files/files.slice'
import { networkReducer } from '../../sagas/network/network.slice'

export const reducers = {
  [StoreKeys.Communities]: communitiesReducer,
  [StoreKeys.Identity]: identityReducer,
  [StoreKeys.Users]: usersReducer,
  [StoreKeys.Errors]: errorsReducer,
  [StoreKeys.Messages]: messagesReducer,
  [StoreKeys.PublicChannels]: publicChannelsReducer,
  [StoreKeys.Connection]: connectionReducer,
  [StoreKeys.Settings]: settingsReducer,
  [StoreKeys.Files]: filesReducer,
  [StoreKeys.LastAction]: lastActionReducer,
  [StoreKeys.Network]: networkReducer,
  // Only for data collectiong purposes
  // [StoreKeys.CollectData]: collectDataReducer
}

export const prepareStore = (mockedState?: { [key in StoreKeys]?: any }) => {
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(combinedReducers, mockedState, applyMiddleware(...[sagaMiddleware, thunk]))

  return {
    store,
    runSaga: sagaMiddleware.run,
  }
}
