import AsyncStorage from '@react-native-async-storage/async-storage'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'

import { NodeEnv } from '../utils/const/NodeEnv.enum'
import { initActions } from './init/init.slice'
import { rootReducer } from './root.reducer'

import { storeKeys as StateManagerStoreKeys, MessagesTransform } from '@quiet/state-manager'

const persistedReducer = persistReducer(
  {
    key: 'persistedReducer',
    storage: AsyncStorage,
    whitelist: [
      StateManagerStoreKeys.Identity,
      StateManagerStoreKeys.Communities,
      StateManagerStoreKeys.PublicChannels,
      StateManagerStoreKeys.Messages
    ],
    transforms: [MessagesTransform]
  },
  rootReducer
)

export const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  devTools: process.env.NODE_ENV === NodeEnv.Development,
  middleware: [
    ...getDefaultMiddleware({ serializableCheck: false, thunk: false }),
    sagaMiddleware
  ],
  reducer: persistedReducer
})

export const persistor = persistStore(store, {}, () => {
  store.dispatch(initActions.setStoreReady())
})
