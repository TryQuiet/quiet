import { combineReducers, createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import {
  StoreKeys as StateManagerStoreKeys,
  Store,
  communities,
  identity,
  users,
  errors,
  messages,
  publicChannels,
  connection,
  settings,
  files,
  network
} from '@quiet/state-manager'
import { StoreKeys } from '../../store/store.keys'
import { initReducer } from '../../store/init/init.slice'
import { navigationReducer } from '../../store/navigation/navigation.slice'

export const reducers = {
  [StateManagerStoreKeys.Communities]: communities.reducer,
  [StateManagerStoreKeys.Identity]: identity.reducer,
  [StateManagerStoreKeys.Users]: users.reducer,
  [StateManagerStoreKeys.Errors]: errors.reducer,
  [StateManagerStoreKeys.Messages]: messages.reducer,
  [StateManagerStoreKeys.PublicChannels]: publicChannels.reducer,
  [StateManagerStoreKeys.Connection]: connection.reducer,
  [StateManagerStoreKeys.Settings]: settings.reducer,
  [StateManagerStoreKeys.Files]: files.reducer,
  [StateManagerStoreKeys.Network]: network.reducer,
  [StoreKeys.Init]: initReducer,
  [StoreKeys.Navigation]: navigationReducer
}

export const prepareStore = (mockedState?: { [key in StoreKeys]?: any }) => {
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    combinedReducers,
    mockedState,
    applyMiddleware(...[sagaMiddleware, thunk])
  )

  return {
    store,
    runSaga: sagaMiddleware.run
  }
}
