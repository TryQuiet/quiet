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

import { usersReducer, usersActions, UsersState } from './sagas/users/users.slice'
import { usersSelectors } from './sagas/users/users.selectors'

import { identityReducer, identityActions, IdentityState } from './sagas/identity/identity.slice'

import { identitySelectors } from './sagas/identity/identity.selectors'

import { messagesActions, messagesReducer } from './sagas/messages/messages.slice'

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

import { connectionActions, connectionReducer } from './sagas/appConnection/connection.slice'
import { connectionSelectors } from './sagas/appConnection/connection.selectors'

import { settingsActions, settingsReducer, SettingsState } from './sagas/settings/settings.slice'
import { settingsSelectors } from './sagas/settings/settings.selectors'

import { filesActions, filesReducer } from './sagas/files/files.slice'
import { filesSelectors } from './sagas/files/files.selectors'

export { SocketActionTypes } from './sagas/socket/const/actionTypes'
export { Store } from './sagas/store.types'
export { TestStore, TestStoreState } from './utils/tests/types'
export { StoreKeys } from './sagas/store.keys'

export { prepareStore } from './utils/tests/prepareStore'
export { useIO } from './sagas/socket/startConnection/startConnection.saga'

export { getFactory } from './utils/tests/factories'
export * from './utils/tests/helpers'

export { parseName } from './utils/functions/naming/naming'

export { Community } from './sagas/communities/communities.slice'

export { communitiesAdapter } from './sagas/communities/communities.adapter'
export { certificatesAdapter } from './sagas/users/users.adapter'

export {
  publicChannelsAdapter,
  channelMessagesAdapter
} from './sagas/publicChannels/publicChannels.adapter'

export { identityAdapter } from './sagas/identity/identity.adapter'

export { PublicChannelsTransform } from './sagas/publicChannels/publicChannels.transform'
export { MessagesTransform } from './sagas/messages/messages.transform'
export { FilesTransform } from './sagas/files/files.transform'

export { AUTODOWNLOAD_SIZE_LIMIT } from './constants'

export * from './sagas/identity/identity.types'

export * from './sagas/communities/communities.types'

export * from './sagas/users/users.types'

export * from './sagas/publicChannels/publicChannels.types'

export * from './sagas/messages/messages.types'

export * from './sagas/files/files.types'

export * from './sagas/errors/errors.types'

export * from './sagas/settings/settings.types'

export const app = {
  actions: appActions
}

export const settings = {
  reducer: settingsReducer,
  State: SettingsState,
  selectors: settingsSelectors,
  actions: settingsActions
}

export const publicChannels = {
  reducer: publicChannelsReducer,
  State: PublicChannelsState,
  selectors: publicChannelsSelectors,
  actions: publicChannelsActions,
  sagas: publicChannelsMasterSaga
}

export const users = {
  reducer: usersReducer,
  State: UsersState,
  actions: usersActions,
  selectors: usersSelectors
}

export const identity = {
  reducer: identityReducer,
  State: IdentityState,
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
  State: CommunitiesState,
  actions: communitiesActions,
  selectors: communitiesSelectors
}

export const connection = {
  reducer: connectionReducer,
  actions: connectionActions,
  selectors: connectionSelectors
}

export const files = {
  reducer: filesReducer,
  actions: filesActions,
  selectors: filesSelectors
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
  socketActionTypes,
  settings
}
