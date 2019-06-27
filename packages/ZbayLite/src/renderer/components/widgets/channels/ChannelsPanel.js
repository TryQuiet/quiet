import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { withContentRect } from 'react-measure'

import Grid from '@material-ui/core/Grid'
import RootRef from '@material-ui/core/RootRef'

import ScalingChannelsList from './ScalingChannelsList'
import SidebarHeader from '../../ui/SidebarHeader'
import AddChannelAction from '../../../containers/widgets/channels/AddChannelAction'
import { withSpinnerLoader } from '../../ui/SpinnerLoader'

const constants = {
  sidebarHeight: 50,
  gutter: 20
}

export const ChannelsPanel = ({ channels, loading, measureRef, contentRect }) => {
  const baseHeight = contentRect.bounds.height || (constants.sidebarHeight + constants.gutter)
  return (
    <RootRef rootRef={measureRef}>
      <Grid container item xs direction='column'>
        <SidebarHeader
          title='Channels'
          actions={[
            <AddChannelAction key='create-channel' />
          ]}
        />
        <ScalingChannelsList
          channels={channels}
          maxHeight={baseHeight - constants.sidebarHeight - constants.gutter}
        />
      </Grid>
    </RootRef>
  )
}

ChannelsPanel.propTypes = {
  channels: PropTypes.instanceOf(Immutable.List).isRequired,
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
  channels: Immutable.List()
}

export default R.compose(
  withSpinnerLoader,
  withContentRect('bounds')
)(ChannelsPanel)
