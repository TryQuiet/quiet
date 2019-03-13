import React from 'react'
import PropTypes from 'prop-types'

import BaseChannelsList, { getItemSize, propTypes } from './BaseChannelsList'

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
  channels: PropTypes.arrayOf(propTypes.channel).isRequired,
  displayAddress: PropTypes.bool
}

ScalingChannelsList.defaultProps = {
  channels: []
}

export default React.memo(ScalingChannelsList)
