import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, PublicChannel, publicChannels } from '@quiet/nectar'
import ChannelsListItemComponent from '../../../components/widgets/channels/ChannelsListItem'

interface ChannelsListItemContainerProps {
  channel: PublicChannel
}

export const ChannelsListItem: React.FC<ChannelsListItemContainerProps> = ({
  channel
}) => {
  const dispatch = useDispatch()

  const unread = useSelector(publicChannels.selectors.currentChannelUnreadStatus)

  const currentCommunity = useSelector(communities.selectors.currentCommunityId)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const selected = currentChannel === channel.name

  const setCurrentChannel = (address: string) => {
    dispatch(publicChannels.actions.setCurrentChannel({
      channelAddress: address,
      communityId: currentCommunity
    }))
  }

  return (
    <ChannelsListItemComponent
      channel={channel}
      unread={unread}
      selected={selected}
      setCurrentChannel={setCurrentChannel}
    />
  )
}

export default ChannelsListItem
