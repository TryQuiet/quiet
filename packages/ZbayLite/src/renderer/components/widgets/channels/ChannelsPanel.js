import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { withContentRect } from 'react-measure'

import Grid from '@material-ui/core/Grid'
import RootRef from '@material-ui/core/RootRef'

import { propTypes } from './BaseChannelsList'
import ScalingChannelsList from './ScalingChannelsList'
import SidebarHeader from '../../ui/SidebarHeader'
import CreateChannelModal from '../CreateChannelModal'

const constants = {
  sidebarHeight: 50,
  gutter: 20
}

export const ChannelsPanel = ({ channels, measureRef, contentRect }) => {
  const baseHeight = contentRect.bounds.height || (constants.sidebarHeight + constants.gutter)
  return (
    <RootRef rootRef={measureRef}>
      <Grid container item xs direction='column'>
        <SidebarHeader
          title='Channels'
          actions={[
            <CreateChannelModal key='create-channel' />
          ]}
        />
        <ScalingChannelsList
          channels={channels}
          maxHeight={baseHeight - constants.sidebarHeight - constants.gutter} />
      </Grid>
    </RootRef>
  )
}

ChannelsPanel.propTypes = {
  channels: PropTypes.arrayOf(propTypes.channel).isRequired,
  measureRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(React.Element) })
  ]).isRequired,
  contentRect: PropTypes.shape({
    bounds: PropTypes.shape({
      height: PropTypes.number
    }).isRequired
  })
}

ChannelsPanel.defaultProps = {
  channels: []
}

export default R.compose(
  React.memo,
  withContentRect('bounds')
)(ChannelsPanel)
