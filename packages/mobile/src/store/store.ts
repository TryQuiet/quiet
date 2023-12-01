import FilesystemStorage from 'redux-persist-filesystem-storage'
import RNFetchBlob from 'react-native-blob-util'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'

import { NodeEnv } from '../utils/const/NodeEnv.enum'
import { initActions } from './init/init.slice'
import { rootReducer } from './root.reducer'

import {
  storeKeys as StateManagerStoreKeys,
  CommunitiesTransform,
  PublicChannelsTransform,
  MessagesTransform,
  FilesTransform,
  ConnectionTransform,
  UsersTransform,
} from '@quiet/state-manager'

import { StoreKeys } from './store.keys'
import { InitTransform } from './init/init.transform'

FilesystemStorage.config({
  storagePath: `${RNFetchBlob.fs.dirs.DocumentDir}/persistStore2`,
  encoding: "utf8",
  toFileName: (name: string) => name.split(":").join("-"),
  fromFileName: (name: string) => name.split("-").join(":"),
});

const persistedReducer = persistReducer(
  {
    key: 'persistedReducer',
    storage: FilesystemStorage,
    whitelist: [
      StateManagerStoreKeys.Identity,
      StateManagerStoreKeys.Communities,
      StateManagerStoreKeys.PublicChannels,
      StateManagerStoreKeys.Users,
      StateManagerStoreKeys.Messages,
      StateManagerStoreKeys.Files,
      StateManagerStoreKeys.Connection,
      StoreKeys.Init,
    ],
    transforms: [
      CommunitiesTransform,
      PublicChannelsTransform,
      MessagesTransform,
      FilesTransform,
      InitTransform,
      ConnectionTransform,
      UsersTransform,
    ],
  },
  rootReducer
)

export const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  devTools: process.env.NODE_ENV === NodeEnv.Development,
  middleware: [
    ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false, thunk: false }),
    sagaMiddleware,
  ],
  reducer: persistedReducer,
})

export const persistor = persistStore(store, {}, () => {
  store.dispatch(initActions.setStoreReady())
})
