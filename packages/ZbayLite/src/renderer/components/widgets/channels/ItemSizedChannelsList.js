import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'

import BaseChannelsList, { getItemSize } from './BaseChannelsList'

export const ItemSizedChannelsList = ({ channels, itemsCount, displayAddress }) => (
  <BaseChannelsList
    height={itemsCount * getItemSize(displayAddress)}
    channels={channels}
    displayAddress={displayAddress}
  />
)

ItemSizedChannelsList.propTypes = {
  channels: PropTypes.instanceOf(Immutable.List),
  displayAddress: PropTypes.bool,
  itemsCount: PropTypes.number
}

ItemSizedChannelsList.defaultProps = {
  channels: Immutable.List()
}

export default React.memo(ItemSizedChannelsList)
