import React from 'react'
import { IChannelInfo } from '@zbayapp/nectar'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'

interface BaseChannelsListProps {
  channels: IChannelInfo[]
  directMessages?: boolean
  selected: string
}

export const BaseChannelsList: React.FC<BaseChannelsListProps> = ({
  channels = [],
  directMessages = false,
  selected
}) => {
  return (
    <List disablePadding>
      {channels
        .map(channel => (
          <ChannelsListItem
            key={channel.name}
            channel={channel}
            directMessages={directMessages}
            selected={selected}
          />
        ))}
    </List>
  )
}

export default React.memo(BaseChannelsList)
