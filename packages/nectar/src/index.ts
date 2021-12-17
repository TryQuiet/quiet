import { useIO } from './sagas/socket/startConnection/startConnection.saga'

import { reducers } from './sagas/reducers'

import { appActions } from './sagas/app/app.slice'

import {
  publicChannelsReducer,
  publicChannelsActions,
  PublicChannelsState
} from './sagas/publicChannels/publicChannels.slice'

import { publicChannelsSelectors } from './sagas/publicChannels/publicChannels.selectors'
import { publicChannelsMasterSaga } from './sagas/publicChannels/publicChannels.master.saga'

import { usersReducer, usersActions } from './sagas/users/users.slice'
import { usersSelectors } from './sagas/users/users.selectors'

import {
  identityReducer,
  identityActions,
  IdentityState
} from './sagas/identity/identity.slice'

import { identitySelectors } from './sagas/identity/identity.selectors'

import {
  messagesActions,
  messagesReducer
} from './sagas/messages/messages.slice'

import { messagesSelectors } from './sagas/messages/messages.selectors'

import { errorsSelectors } from './sagas/errors/errors.selectors'
import { errorsReducer, errorsActions } from './sagas/errors/errors.slice'

import {
  communitiesActions,
  communitiesReducer,
  CommunitiesState
} from './sagas/communities/communities.slice'

import { SocketActionTypes } from './sagas/socket/const/actionTypes'

import { communitiesSelectors } from './sagas/communities/communities.selectors'

import { StoreKeys } from './sagas/store.keys'

import {
  connectionActions,
  connectionReducer
} from './sagas/appConnection/connection.slice'
import { connectionSelectors } from './sagas/appConnection/connection.selectors'

export { SocketActionTypes } from './sagas/socket/const/actionTypes'
export { StoreKeys } from './sagas/store.keys'

export { prepareStore } from './utils/tests/prepareStore'
export { useIO } from './sagas/socket/startConnection/startConnection.saga'

export { getFactory } from './utils/tests/factories'
export * from './utils/tests/helpers'

export {
  DisplayableMessage,
  PublicChannel,
  ChannelMessage
} from './sagas/publicChannels/publicChannels.types'

export {
  Community
} from './sagas/communities/communities.slice'

export {
  CommunityChannels
} from './sagas/publicChannels/publicChannels.slice'

export {
  Identity
} from './sagas/identity/identity.slice'

export { communityChannelsAdapter } from './sagas/publicChannels/publicChannels.adapter'
export { communitiesAdapter } from './sagas/communities/communities.adapter'

export {
  publicChannelsAdapter,
  channelMessagesAdapter
} from './sagas/publicChannels/publicChannels.adapter'

export { identityAdapter } from './sagas/identity/identity.adapter'

export const app = {
  actions: appActions
}

export const publicChannels = {
  reducer: publicChannelsReducer,
  state: PublicChannelsState,
  selectors: publicChannelsSelectors,
  actions: publicChannelsActions,
  sagas: publicChannelsMasterSaga
}

export const users = {
  reducer: usersReducer,
  actions: usersActions,
  selectors: usersSelectors
}

export const identity = {
  reducer: identityReducer,
  state: IdentityState,
  actions: identityActions,
  selectors: identitySelectors
}

export const messages = {
  reducer: messagesReducer,
  actions: messagesActions,
  selectors: messagesSelectors
}

export const errors = {
  reducer: errorsReducer,
  actions: errorsActions,
  selectors: errorsSelectors
}

export const communities = {
  reducer: communitiesReducer,
  state: CommunitiesState,
  actions: communitiesActions,
  selectors: communitiesSelectors
}

export const connection = {
  reducer: connectionReducer,
  actions: connectionActions,
  selectors: connectionSelectors
}

export const socket = {
  useIO
}

export const storeKeys = StoreKeys

export const socketActionTypes = SocketActionTypes

export default {
  app,
  publicChannels,
  users,
  identity,
  messages,
  errors,
  communities,
  connection,
  reducers,
  storeKeys,
  socketActionTypes
}
