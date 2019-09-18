import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'

import BaseChannelsList, { getItemSize } from './BaseChannelsList'

export const ItemSizedChannelsList = ({
  channels,
  itemsCount,
  displayAddress,
  directMessages,
  selected
}) => {
  return (
    <BaseChannelsList
      height={itemsCount * getItemSize(displayAddress)}
      channels={channels}
      displayAddress={displayAddress}
      directMessages={directMessages}
      selected={selected}
    />
  )
}

ItemSizedChannelsList.propTypes = {
  channels: PropTypes.instanceOf(Immutable.List),
  selected: PropTypes.instanceOf(Immutable.Record).isRequired,
  displayAddress: PropTypes.bool,
  itemsCount: PropTypes.number,
  directMessages: PropTypes.bool
}

ItemSizedChannelsList.defaultProps = {
  channels: Immutable.List()
}

export default React.memo(ItemSizedChannelsList)
