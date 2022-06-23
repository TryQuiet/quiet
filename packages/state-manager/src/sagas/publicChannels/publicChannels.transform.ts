import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import {
  communityChannelsAdapter,
  publicChannelsSubscriptionsAdapter
} from './publicChannels.adapter'
import { PublicChannelsState } from './publicChannels.slice'

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key) => {
    const communityChannels = Object.values(outboundState.channels.entities)
    for (const community of communityChannels) {
      communityChannelsAdapter.updateOne(outboundState.channels, {
        id: community.id,
        changes: {
          channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState()
        }
      })
    }
    return {
      ...outboundState
    }
  },
  { whitelist: [StoreKeys.Messages] }
)
