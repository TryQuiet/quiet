import { DEFAULT_GENERIC_CHANNEL_PERMISSIONS, INITIAL_CURRENT_CHANNEL_ID } from '@quiet/types'
import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import {
  channelSpecificPermissionsAdapter,
  publicChannelsAdapter,
  publicChannelsSubscriptionsAdapter,
} from './publicChannels.adapter'
import { type PublicChannelsState } from './publicChannels.slice'
import { createLogger } from '../../utils/logger'
import { filterTransportVerifiedMessages, isPersistableMessage } from '../messages/verifiedMessagePersistence'

const logger = createLogger('publicChannelsTransform')

export const sanitizePublicChannelsPersistenceState = (outboundState: PublicChannelsState): PublicChannelsState => {
  const generalChannelId = getGeneralChannelId(outboundState)

  const channelEntities = { ...outboundState.channels.entities }
  for (const channelId of outboundState.channels.ids) {
    const channel = channelEntities[channelId]
    if (channel != null) {
      channelEntities[channelId] = {
        ...channel,
        messages: filterTransportVerifiedMessages(channel.messages),
      }
    }
  }
  const statusEntities = { ...outboundState.channelsStatus.entities }
  for (const channelId of outboundState.channelsStatus.ids) {
    const status = statusEntities[channelId]
    if (status?.newestMessage != null && !isPersistableMessage(status.newestMessage)) {
      statusEntities[channelId] = { ...status, newestMessage: null, unread: false }
    }
  }

  return {
    ...outboundState,
    channels: { ...outboundState.channels, entities: channelEntities },
    channelsStatus: { ...outboundState.channelsStatus, entities: statusEntities },
    currentChannelId: generalChannelId,
    channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState(),
    channelSpecificPermissions: channelSpecificPermissionsAdapter.getInitialState(),
    genericChannelPermissions: DEFAULT_GENERIC_CHANNEL_PERMISSIONS,
  }
}

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key: any) => sanitizePublicChannelsPersistenceState(outboundState),
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
