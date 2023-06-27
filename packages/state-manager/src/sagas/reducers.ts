import { connectionReducer } from './appConnection/connection.slice'
import { communitiesReducer } from './communities/communities.slice'
import { errorsReducer } from './errors/errors.slice'
import { filesReducer } from './files/files.slice'
import { identityReducer } from './identity/identity.slice'
import { messagesReducer } from './messages/messages.slice'
import { networkReducer } from './network/network.slice'
import { publicChannelsReducer } from './publicChannels/publicChannels.slice'
import { settingsReducer } from './settings/settings.slice'
import { StoreKeys } from './store.keys'
import { usersReducer } from './users/users.slice'

export const reducers = {
  [StoreKeys.PublicChannels]: publicChannelsReducer,
  [StoreKeys.Users]: usersReducer,
  [StoreKeys.Communities]: communitiesReducer,
  [StoreKeys.Identity]: identityReducer,
  [StoreKeys.Errors]: errorsReducer,
  [StoreKeys.Messages]: messagesReducer,
  [StoreKeys.Connection]: connectionReducer,
  [StoreKeys.Settings]: settingsReducer,
  [StoreKeys.Files]: filesReducer,
  [StoreKeys.Network]: networkReducer,
}
