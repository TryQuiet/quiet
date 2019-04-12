import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'

import BaseChannelsList, { getItemSize } from './BaseChannelsList'

export const ScalingChannelsList = ({ channels, maxHeight, displayAddress }) => {
  const itemSize = getItemSize(displayAddress)
  return (
    <BaseChannelsList
      height={parseInt(maxHeight / itemSize) * itemSize}
      channels={channels}
      displayAddress={displayAddress}
    />
  )
}

ScalingChannelsList.propTypes = {
  maxHeight: PropTypes.number.isRequired,
  channels: PropTypes.instanceOf(Immutable.List).isRequired,
  displayAddress: PropTypes.bool
}

ScalingChannelsList.defaultProps = {
  channels: Immutable.List()
}

export default React.memo(ScalingChannelsList)
