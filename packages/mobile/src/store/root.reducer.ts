import { storageReducer } from './storage/storage.slice'
 import {StoreKeys} from './store.keys';
import {publicChannelsReducer} from './publicChannels/publicChannels.slice';
import {combineReducers} from '@reduxjs/toolkit';
import {socketReducer} from './socket/socket.slice';

export const rootReducer = combineReducers({ [StoreKeys.Storage]: storageReducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.PublicChannels]: publicChannelsReducer,
});
