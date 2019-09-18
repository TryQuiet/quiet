import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import ScalingChannelsList from './ScalingChannelsList'

const constants = {
  sidebarHeight: 40,
  gutter: 10
}

export const ChannelsPanel = ({ channels, contentRect }) => {
  return (
    <ScalingChannelsList
      channels={channels}
      maxHeight={contentRect.bounds.height - constants.sidebarHeight - constants.gutter}
    />
  )
}

ChannelsPanel.propTypes = {
  channels: PropTypes.instanceOf(Immutable.List).isRequired,
  contentRect: PropTypes.shape({
    bounds: PropTypes.shape({
      height: PropTypes.number
    }).isRequired
  })
}

ChannelsPanel.defaultProps = {
  channels: Immutable.List()
}

export default R.compose(React.memo)(ChannelsPanel)
