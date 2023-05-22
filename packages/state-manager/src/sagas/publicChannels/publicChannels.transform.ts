import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { publicChannelsAdapter, publicChannelsSubscriptionsAdapter } from './publicChannels.adapter'
import { PublicChannelsState } from './publicChannels.slice'

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key: any) => {
    const selectors = publicChannelsAdapter.getSelectors()
    const publicChannelStorage = selectors.selectAll(outboundState.channels)
    const generalChannel = publicChannelStorage.find(channel => channel.name === 'general')
    const generalChannelId = generalChannel?.id || ''
    return {
      ...outboundState,
      currentChannelId: generalChannelId,
      channels: outboundState.channels,
      channelsStatus: outboundState.channelsStatus,
      channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState()
    }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)
