import { useIO } from './sagas/socket/startConnection/startConnection.saga';

import { reducers } from './sagas/reducers';

import {
  publicChannelsReducer,
  publicChannelsActions,
} from './sagas/publicChannels/publicChannels.slice';
import { publicChannelsSelectors } from './sagas/publicChannels/publicChannels.selectors';
import { publicChannelsMasterSaga } from './sagas/publicChannels/publicChannels.master.saga';

import { usersReducer, usersActions } from './sagas/users/users.slice';
import { usersSelectors } from './sagas/users/users.selectors';

import {
  identityReducer,
  identityActions,
} from './sagas/identity/identity.slice';
import { identitySelectors } from './sagas/identity/identity.selectors';

import {
  messagesActions,
  messagesReducer,
} from './sagas/messages/messages.slice';
import { messagesSelectors } from './sagas/messages/messages.selectors';

import { errorsSelectors } from './sagas/errors/errors.selectors';
import { errorsReducer, errorsActions } from './sagas/errors/errors.slice';

import {
  communitiesActions,
  communitiesReducer,
} from './sagas/communities/communities.slice';

import { SocketActionTypes } from './sagas/socket/const/actionTypes';
import { communitiesSelectors } from './sagas/communities/communities.selectors';

import { StoreKeys } from './sagas/store.keys';
import {
  connectionActions,
  connectionReducer,
} from './sagas/appConnection/connection.slice';
import { connectionSelectors } from './sagas/appConnection/connection.selectors';

export { getFactory } from './utils/tests/factories';
export * from './utils/tests/helpers';

export {
  DisplayableMessage,
  PublicChannel,
  ChannelMessage,
} from './sagas/publicChannels/publicChannels.types';

export { communityChannelsAdapter } from './sagas/publicChannels/publicChannels.adapter';
export { communitiesAdapter } from './sagas/communities/communities.adapter';

export { identityAdapter } from './sagas/identity/identity.adapter';

export const publicChannels = {
  reducer: publicChannelsReducer,
  selectors: publicChannelsSelectors,
  actions: publicChannelsActions,
  sagas: publicChannelsMasterSaga,
};

export const users = {
  reducer: usersReducer,
  actions: usersActions,
  selectors: usersSelectors,
};

export const identity = {
  reducer: identityReducer,
  actions: identityActions,
  selectors: identitySelectors,
};

export const messages = {
  reducer: messagesReducer,
  actions: messagesActions,
  selectors: messagesSelectors,
};

export const errors = {
  reducer: errorsReducer,
  actions: errorsActions,
  selectors: errorsSelectors,
};

export const communities = {
  reducer: communitiesReducer,
  actions: communitiesActions,
  selectors: communitiesSelectors,
};

export const connection = {
  reducer: connectionReducer,
  actions: connectionActions,
  selectors: connectionSelectors,
};

export const socket = {
  useIO,
};

export const storeKeys = StoreKeys;

export const socketActionTypes = SocketActionTypes;

export default {
  publicChannels,
  users,
  identity,
  messages,
  errors,
  communities,
  connection,
  reducers,
  storeKeys,
  socketActionTypes,
};
