import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from './store.keys';
import { initReducer } from './init/init.slice';
import {
  communities,
  identity,
  publicChannels,
  users,
  messages,
} from '@zbayapp/nectar';

export const rootReducer = combineReducers({
  [StoreKeys.Init]: initReducer,
  [StoreKeys.Communities]: communities.reducer,
  [StoreKeys.Identity]: identity.reducer,
  [StoreKeys.PublicChannels]: publicChannels.reducer,
  [StoreKeys.Users]: users.reducer,
  [StoreKeys.Messages]: messages.reducer,
});
