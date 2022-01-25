import React from 'react'
import { PublicChannel } from '@quiet/nectar'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'

interface BaseChannelsListProps {
  channels: PublicChannel[]
}

export const BaseChannelsList: React.FC<BaseChannelsListProps> = ({
  channels = []
}) => {
  return (
    <List disablePadding>
      {channels
        .map(channel => (
          <ChannelsListItem
            key={channel.name}
            channel={channel}
          />
        ))}
    </List>
  )
}

export default React.memo(BaseChannelsList)
