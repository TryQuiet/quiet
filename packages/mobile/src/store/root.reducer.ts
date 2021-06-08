import { initReducer } from './init/init.slice';
import { assetsReducer } from './assets/assets.slice';
import { StoreKeys } from './store.keys';
import { publicChannelsReducer } from './publicChannels/publicChannels.slice';
import { combineReducers } from '@reduxjs/toolkit';
import { socketReducer } from './socket/socket.slice';

export const rootReducer = combineReducers({
  [StoreKeys.Init]: initReducer,
  [StoreKeys.Assets]: assetsReducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.PublicChannels]: publicChannelsReducer,
});
