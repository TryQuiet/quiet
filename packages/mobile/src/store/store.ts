import FilesystemStorage from 'redux-persist-filesystem-storage'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'

import { NodeEnv } from '../utils/const/NodeEnv.enum'
import { initActions } from './init/init.slice'
import { rootReducer } from './root.reducer'

import {
  storeKeys as StateManagerStoreKeys,
  PublicChannelsTransform,
  MessagesTransform,
  FilesTransform,
  ConnectionTransform,
  IdentityTransform
} from '@quiet/state-manager'
import { StoreKeys } from './store.keys'
import { InitTransform } from './init/init.transform'

const persistedReducer = persistReducer(
  {
    key: 'persistedReducer',
    storage: FilesystemStorage,
    whitelist: [
      StateManagerStoreKeys.Identity,
      StateManagerStoreKeys.Communities,
      StateManagerStoreKeys.PublicChannels,
      StateManagerStoreKeys.Messages,
      StateManagerStoreKeys.Files,
      StateManagerStoreKeys.Connection,
      StoreKeys.Init
    ],
    transforms: [
      PublicChannelsTransform,
      MessagesTransform,
      FilesTransform,
      InitTransform,
      ConnectionTransform,
      IdentityTransform
    ]
  },
  rootReducer
)

export const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  devTools: process.env.NODE_ENV === NodeEnv.Development,
  middleware: [
    ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false, thunk: false }),
    sagaMiddleware
  ],
  reducer: persistedReducer
})

export const persistor = persistStore(store, {}, () => {
  store.dispatch(initActions.setStoreReady())
})
