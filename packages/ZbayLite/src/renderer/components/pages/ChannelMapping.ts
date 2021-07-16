import ChannelInput from '../../containers/widgets/channels/ChannelInput'
import DirectMessageInput from '../../containers/widgets/channels/DirectMessageInput'
import ChannelHeader from '../../containers/widgets/channels/ChannelHeader'
import DirectMessagesHeader from '../../containers/widgets/channels/DirectMessagesHeader'
import ChannelMessages from '../../containers/widgets/channels/ChannelMessages'
import DirectMessagesMessages from '../../containers/widgets/channels/DirectMessagesMessages'
import { CHANNEL_TYPE } from './ChannelTypes'

export const channelTypeToHeader = {
  [CHANNEL_TYPE.DIRECT_MESSAGE]: DirectMessagesHeader,
  [CHANNEL_TYPE.NORMAL]: ChannelHeader
}
export const channelTypeToInput = {
  [CHANNEL_TYPE.DIRECT_MESSAGE]: DirectMessageInput,
  [CHANNEL_TYPE.NORMAL]: ChannelInput
}
export const channelTypeToMessages = {
  [CHANNEL_TYPE.DIRECT_MESSAGE]: DirectMessagesMessages,
  [CHANNEL_TYPE.NORMAL]: ChannelMessages
}
