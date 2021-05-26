import React from 'react'

import ChannelsListItemComponent, { ChannelsListItemComponentProps } from '../../../components/widgets/channels/ChannelsListItem'

type ChannelsListItemContainerProps = ChannelsListItemComponentProps

export const ChannelsListItem: React.FC<ChannelsListItemContainerProps> = ({
  channel,
  selected,
  directMessages
}) => {
  return (
    <ChannelsListItemComponent
      selected={selected}
      directMessages={directMessages}
      channel={channel}
    />
  )
}

export default ChannelsListItem
