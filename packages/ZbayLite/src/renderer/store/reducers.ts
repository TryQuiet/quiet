import { combineReducers } from '@reduxjs/toolkit'

import createElectronStorage from 'redux-persist-electron-storage'

import { persistReducer } from 'redux-persist'

import { StoreType } from './handlers/types'
import { StoreKeys } from './store.keys'

import nectarReducers, { storeKeys as NectarStoreKeys } from '@zbayapp/nectar'

import { socketReducer } from '../sagas/socket/socket.slice'
import { modalsReducer } from '../sagas/modals/modals.slice'

import appHandlers from './handlers/app'
import waggleHandlers from './handlers/waggle'
import contactsHandlers from './handlers/contacts'
import channelHandlers from './handlers/channel'
import directMessages from './handlers/directMessages'
import directMessageChannelHandlers from './handlers/directMessageChannel'
import notifications from './handlers/notifications'
import notificationCenter from './handlers/notificationCenter'
import mentionsHandlers from './handlers/mentions'
import criticalErrorHandlers from './handlers/criticalError'
import whitelistHandlers from './handlers/whitelist'

const reduxStorage = createElectronStorage()

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: [
    NectarStoreKeys.Identity,
    NectarStoreKeys.Communities,
    NectarStoreKeys.PublicChannels,
    StoreKeys.App,
    StoreKeys.Contacts,
    StoreKeys.DirectMessages,
    StoreKeys.Whitelist
  ]
}

export const reducers = {
  ...nectarReducers.reducers,
  [StoreKeys.App]: appHandlers.reducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.Waggle]: waggleHandlers.reducer,
  [StoreKeys.Modals]: modalsReducer,
  [StoreKeys.DirectMessages]: directMessages.reducer,
  [StoreKeys.DirectMessageChannel]: directMessageChannelHandlers.reducer,
  [StoreKeys.Notifications]: notifications.reducer,
  [StoreKeys.NotificationCenter]: notificationCenter.reducer,
  [StoreKeys.Channel]: channelHandlers.reducer,
  [StoreKeys.Contacts]: contactsHandlers.reducer,
  [StoreKeys.Mentions]: mentionsHandlers.reducer,
  [StoreKeys.Whitelist]: whitelistHandlers.reducer,
  [StoreKeys.CriticalError]: criticalErrorHandlers.reducer
}

export type Store = StoreType<typeof reducers>

export default persistReducer(persistConfig, combineReducers(reducers))
