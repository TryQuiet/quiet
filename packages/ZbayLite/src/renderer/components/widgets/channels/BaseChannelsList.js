import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'

export const propTypes = {
  channel: PropTypes.shape({
    name: PropTypes.string.isRequired,
    private: PropTypes.bool.isRequired,
    hash: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    unread: PropTypes.number,
    description: PropTypes.string
  })
}

export const BaseChannelsList = ({ channels, directMessages, selected }) => {
  return (
    <List disablePadding>
      {channels.map(channel => (
        <ChannelsListItem
          key={directMessages ? channel.get('address') : channel.get('id')}
          channel={channel}
          directMessages={directMessages}
          selected={selected}
        />
      ))}
    </List>
  )
}

BaseChannelsList.propTypes = {
  channels: PropTypes.instanceOf(Immutable.List).isRequired,
  selected: PropTypes.instanceOf(Immutable.Record).isRequired,
  directMessages: PropTypes.bool
}

BaseChannelsList.defaultProps = {
  channels: Immutable.List(),
  displayAddress: false,
  directMessages: false
}

export default React.memo(BaseChannelsList)
