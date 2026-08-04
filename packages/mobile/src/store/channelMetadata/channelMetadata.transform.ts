import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { ChannelMetadataState } from './channelMetadata.slice'

export const ChannelMetadataTransform = createTransform(
  (inboundState: ChannelMetadataState, _key: any) => {
    return inboundState
  },
  (outboundState: ChannelMetadataState, _key: any) => {
    // TODO: determine if we still need this transform
    return outboundState
  },
  { whitelist: [StoreKeys.ChannelMetadata] }
)
