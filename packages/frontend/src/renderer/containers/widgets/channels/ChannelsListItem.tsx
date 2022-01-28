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

  const currentCommunity = useSelector(communities.selectors.currentCommunityId)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const selected = currentChannel === channel.name

  const setCurrentChannel = (name: string) => {
    dispatch(publicChannels.actions.setCurrentChannel({
      channel: name,
      communityId: currentCommunity
    }))
  }

  return (
    <ChannelsListItemComponent
      channel={channel}
      selected={selected}
      setCurrentChannel={setCurrentChannel}
    />
  )
}

export default ChannelsListItem
