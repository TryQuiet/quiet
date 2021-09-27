import React from 'react'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'
import { unknownUserId } from '../../../../shared/static'
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
  unknownMessages = [],
  directMessages = false,
  selected
}) => {
  return (
    <List disablePadding>
      {channels
        .filter(ch => ch.username !== unknownUserId)
        .map(channel => (
          <ChannelsListItem
            key={channel.username}
            channel={channel}
            directMessages={directMessages}
            selected={selected}
          />
        ))}
      {unknownMessages?.length > 0 && (
        <ChannelsListItem
          key={unknownUserId}
          channel={unknownMessages[0]}
          directMessages={directMessages}
          selected={selected}
        />
      )}
    </List>
  )
}

export default React.memo(BaseChannelsList)
