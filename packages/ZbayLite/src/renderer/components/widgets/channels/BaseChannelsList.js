import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import { Scrollbars } from 'react-custom-scrollbars'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'

export const constants = {
  itemSize: 37,
  itemWithSecondarySize: 54
}

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

export const getItemSize = displayAddress =>
  displayAddress ? constants.itemWithSecondarySize : constants.itemSize

export const BaseChannelsList = ({ channels, height, displayAddress, directMessages }) => {
  return (
    <Scrollbars autoHide style={{ height }} autoHideTimeout={500}>
      <List disablePadding>
        {channels.map(channel => (
          <ChannelsListItem
            key={directMessages ? channel.get('address') : channel.get('id')}
            channel={channel}
            displayAddress={displayAddress}
            directMessages={directMessages}
          />
        ))}
      </List>
    </Scrollbars>
  )
}

BaseChannelsList.propTypes = {
  height: PropTypes.number.isRequired,
  channels: PropTypes.instanceOf(Immutable.List).isRequired,
  displayAddress: PropTypes.bool,
  directMessages: PropTypes.bool
}

BaseChannelsList.defaultProps = {
  channels: Immutable.List(),
  displayAddress: false,
  directMessages: false
}

export default React.memo(BaseChannelsList)
