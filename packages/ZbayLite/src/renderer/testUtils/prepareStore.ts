import { communities, identity, users, errors, messages, publicChannels } from '@zbayapp/nectar'
import { StoreKeys as NectarStoreKeys } from '@zbayapp/nectar/lib/sagas/store.keys'
import { StoreKeys } from '../store/store.keys'
import { combineReducers, createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import { socketReducer } from '../sagas/socket/socket.slice'
import { modalsReducer } from '../sagas/modals/modals.slice'

export const reducers = {
  [NectarStoreKeys.Communities]: communities.reducer,
  [NectarStoreKeys.Identity]: identity.reducer,
  [NectarStoreKeys.Users]: users.reducer,
  [NectarStoreKeys.Errors]: errors.reducer,
  [NectarStoreKeys.Messages]: messages.reducer,
  [NectarStoreKeys.PublicChannels]: publicChannels.reducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.Modals]: modalsReducer
}

export const prepareStore = (mockedState?: { [key in StoreKeys | NectarStoreKeys]?: any }) => {
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
