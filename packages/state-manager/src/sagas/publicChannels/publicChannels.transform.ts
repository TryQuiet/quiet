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
      ...outboundState,
      currentChannelAddress: 'general',
      channelsStatus: outboundState.channelsStatus,
      channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState()
    }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)
