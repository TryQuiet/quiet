import React from 'react'
import PropTypes from 'prop-types'

import BaseChannelsList, { getItemSize, propTypes } from './BaseChannelsList'

export const ItemSizedChannelsList = ({ channels, itemsCount, displayAddress }) => (
  <BaseChannelsList
    height={itemsCount * getItemSize(displayAddress)}
    channels={channels}
    displayAddress={displayAddress}
  />
)

ItemSizedChannelsList.propTypes = {
  channels: PropTypes.arrayOf(propTypes.channel),
  displayAddress: PropTypes.bool,
  itemsCount: PropTypes.number
}

ItemSizedChannelsList.defaultProps = {
  channels: []
}

export default React.memo(ItemSizedChannelsList)
