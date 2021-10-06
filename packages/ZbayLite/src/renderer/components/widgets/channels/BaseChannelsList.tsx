import React from 'react'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'
import { Contact } from '../../../store/handlers/contacts'
import { ChannelInfo } from '../../../store/selectors/channel'

interface BaseChannelsListProps {
  channels: Contact[]
  unknownMessages: Contact[]
  directMessages: boolean
  selected: ChannelInfo
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
            key={channel.username}
            channel={channel}
            directMessages={directMessages}
            selected={selected}
          />
        ))}
    </List>
  )
}

export default React.memo(BaseChannelsList)
