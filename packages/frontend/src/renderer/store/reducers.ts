import { combineReducers } from '@reduxjs/toolkit'

import createElectronStorage from 'redux-persist-electron-storage'

import { persistReducer } from 'redux-persist'

import { StoreType } from './handlers/types'
import { StoreKeys } from './store.keys'

import nectarReducers, { storeKeys as NectarStoreKeys } from '@quiet/nectar'

import { socketReducer } from '../sagas/socket/socket.slice'
import { modalsReducer } from '../sagas/modals/modals.slice'

import appHandlers from './handlers/app'

const reduxStorage = createElectronStorage()

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  throttle: 1000,
  whitelist: [
    NectarStoreKeys.Identity,
    NectarStoreKeys.Communities,
    NectarStoreKeys.PublicChannels,
    NectarStoreKeys.Messages,
    NectarStoreKeys.Settings,
    StoreKeys.App
  ]
}

export const reducers = {
  ...nectarReducers.reducers,
  [StoreKeys.App]: appHandlers.reducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.Modals]: modalsReducer
}

export type Store = StoreType<typeof reducers>

export default persistReducer(persistConfig, combineReducers(reducers))
