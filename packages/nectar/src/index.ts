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
} from './sagas/identity/identity.slice';
import { identitySelectors } from './sagas/identity/identity.selectors';

import { StoreKeys } from './sagas/store.keys';
import {
  messagesActions,
  messagesReducer,
} from './sagas/messages/messages.slice';
import { messagesSelectors } from './sagas/messages/messages.selectors';
import { requestPeerIdSaga } from './sagas/identity/requestPeerId/requestPeerId.saga';
import { errorsSelectors } from './sagas/errors/errors.selectors';
import {
  errorsReducer,
  errorsActions,
} from './sagas/errors/errors.slice';

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
  sagas: {
    requestPeerIdSaga,
  },
};

export const messages = {
  reducer: messagesReducer,
  actions: messagesActions,
  selectors: messagesSelectors,
};

export const errors = {
  reducer: errorsReducer,
  actions: errorsActions,
  selectors: errorsSelectors
}

export const socket = {
  useIO,
};

export const storeKeys = StoreKeys;

export default {
  publicChannels,
  users,
  identity,
  messages,
};
