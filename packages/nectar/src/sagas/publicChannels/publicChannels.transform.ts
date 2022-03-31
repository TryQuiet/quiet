import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { publicChannelsAdapter } from './publicChannels.adapter'
import { PublicChannelsState } from './publicChannels.slice'

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key) => {
    for (const community of Object.values(inboundState.channels.entities)) {
      for (const channel of Object.values(inboundState.channels.entities[community.id].channels)) {
        publicChannelsAdapter.updateOne(inboundState.channels.entities[community.id].channels, {
          id: channel.address,
          changes: {
            messagesSlice: 0
          }
        })
      }
    }
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key) => {
    return { ...outboundState }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)
