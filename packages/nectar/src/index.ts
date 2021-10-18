import {
  publicChannelsReducer,
  publicChannelsActions,
} from './sagas/publicChannels/publicChannels.slice';
import { publicChannelsSelectors } from './sagas/publicChannels/publicChannels.selectors';
import { publicChannelsMasterSaga } from './sagas/publicChannels/publicChannels.master.saga';

import { useIO } from './sagas/socket/startConnection/startConnection.saga';

import { usersReducer, usersActions } from './sagas/users/users.slice';
import { usersSelectors } from './sagas/users/users.selectors';

import {
  identityReducer,
  identityActions,
  Identity,
} from './sagas/identity/identity.slice';
import { identitySelectors } from './sagas/identity/identity.selectors';

import { StoreKeys } from './sagas/store.keys';
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

import { reducers } from './sagas/reducers'

import { SocketActionTypes } from './sagas/socket/const/actionTypes'
import { communitiesSelectors } from './sagas/communities/communities.selectors';

export { DisplayableMessage } from './sagas/publicChannels/publicChannels.types'

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
  Identity: Identity,
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
  selectors: communitiesSelectors
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
  reducers,
  storeKeys,
  socketActionTypes
};
