import { combineReducers } from '@reduxjs/toolkit'

import path from 'path'

import createElectronStorage from 'redux-persist-electron-storage'

import ElectronStore from 'electron-store'

import { persistReducer } from 'redux-persist'

import { StoreType } from './handlers/types'
import { StoreKeys } from './store.keys'

import nectarReducers, { storeKeys as NectarStoreKeys, MessagesTransform } from '@quiet/nectar'

import { socketReducer } from '../sagas/socket/socket.slice'
import { modalsReducer } from '../sagas/modals/modals.slice'

import appHandlers from './handlers/app'

const dataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config')
const appPath = process.env.DATA_DIR || (process.env.NODE_ENV === 'development' ? 'Quietdev' : 'Quiet')

const options = {
  projectName: 'quiet',
  cwd: path.join(dataPath, appPath)
}

const store = new ElectronStore<Store>(options)

const reduxStorage = createElectronStorage({ electronStore: store })

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  throttle: 1000,
  whitelist: [
    NectarStoreKeys.Identity,
    NectarStoreKeys.Communities,
    NectarStoreKeys.PublicChannels,
    NectarStoreKeys.Messages,
    StoreKeys.App
  ],
  transforms: [MessagesTransform]
}

export const reducers = {
  ...nectarReducers.reducers,
  [StoreKeys.App]: appHandlers.reducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.Modals]: modalsReducer
}

export type Store = StoreType<typeof reducers>

export default persistReducer(persistConfig, combineReducers(reducers))
