import { INITIAL_CURRENT_CHANNEL_ID } from '@quiet/types'
import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { publicChannelsAdapter, publicChannelsSubscriptionsAdapter } from './publicChannels.adapter'
import { type PublicChannelsState } from './publicChannels.slice'
import { createLogger } from '../../utils/logger'

const logger = createLogger('publicChannelsTransform')

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key: any) => {
    const generalChannelId = getGeneralChannelId(outboundState)

    const transformedOutboundState = { ...outboundState } as any

    return {
      ...transformedOutboundState,
      currentChannelId: generalChannelId,
      channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState(),
    }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)

const getGeneralChannelId = (state: PublicChannelsState) => {
  const selectors = publicChannelsAdapter.getSelectors()
  const publicChannelStorage = selectors.selectAll(state.channels)
  const generalChannel = publicChannelStorage.find(channel => channel.name === 'general')
  logger.info('PublicChannelsTransform: existing general channel id', generalChannel?.id)
  const generalChannelId = generalChannel?.id || INITIAL_CURRENT_CHANNEL_ID
  logger.info('PublicChannelsTransform: new general channel id', generalChannelId)
  return generalChannelId
}
