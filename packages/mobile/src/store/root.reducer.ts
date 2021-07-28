import { usersReducer } from './users/users.slice';
import { messagesReducer } from './messages/messages.slice';
import { identityReducer } from './identity/identity.slice';
import { initReducer } from './init/init.slice';
import { assetsReducer } from './assets/assets.slice';
import { StoreKeys } from './store.keys';
import { publicChannelsReducer } from './publicChannels/publicChannels.slice';
import { combineReducers } from '@reduxjs/toolkit';

export const rootReducer = combineReducers({
  [StoreKeys.Init]: initReducer,
  [StoreKeys.Assets]: assetsReducer,
  [StoreKeys.Identity]: identityReducer,
  [StoreKeys.PublicChannels]: publicChannelsReducer,
  [StoreKeys.Messages]: messagesReducer,
  [StoreKeys.Users]: usersReducer,
});
