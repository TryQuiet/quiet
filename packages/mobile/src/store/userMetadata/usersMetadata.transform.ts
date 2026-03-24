import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { UsersMetadataState } from './usersMetadata.slice'

export const UsersMetadataTransform = createTransform(
  (inboundState: UsersMetadataState, _key: any) => {
    return inboundState
  },
  (outboundState: UsersMetadataState, _key: any) => {
    // TODO: determine if we still need this transform
    return outboundState
  },
  { whitelist: [StoreKeys.UsersMetadata] }
)
