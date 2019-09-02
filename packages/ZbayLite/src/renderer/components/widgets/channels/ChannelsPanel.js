import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import ScalingChannelsList from './ScalingChannelsList'

import { withSpinnerLoader } from '../../ui/SpinnerLoader'

const constants = {
  sidebarHeight: 50,
  gutter: 20
}

export const ChannelsPanel = ({ channels, contentRect }) => {
  const baseHeight = contentRect.bounds.height || constants.sidebarHeight + constants.gutter
  return (
    <ScalingChannelsList
      channels={channels}
      maxHeight={baseHeight - constants.sidebarHeight - constants.gutter}
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

export default R.compose(
  withSpinnerLoader
)(ChannelsPanel)
