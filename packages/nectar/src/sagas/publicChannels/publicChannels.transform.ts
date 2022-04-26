import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { PublicChannelsState } from './publicChannels.slice'

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key) => {
    return { ...outboundState }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)
