import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { publicChannelsAdapter, publicChannelsStatusAdapter, publicChannelsSubscriptionsAdapter } from './publicChannels.adapter'
import { PublicChannelsState } from './publicChannels.slice'

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key) => {
    return {
      currentChannelAddress: 'general',
      channels: publicChannelsAdapter.getInitialState(),
      channelsStatus: publicChannelsStatusAdapter.getInitialState(),
      channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState()
    }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)
