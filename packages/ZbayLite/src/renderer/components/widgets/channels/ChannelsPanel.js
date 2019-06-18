import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { withContentRect } from 'react-measure'

import Grid from '@material-ui/core/Grid'
import RootRef from '@material-ui/core/RootRef'
import CircularProgress from '@material-ui/core/CircularProgress'

import ScalingChannelsList from './ScalingChannelsList'
import SidebarHeader from '../../ui/SidebarHeader'
import AddChannelAction from '../../../containers/widgets/channels/AddChannelAction'

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
        {
          loading
            ? (
              <Grid
                container
                justify='center'
                alignItems='center'
                spacing={32}
              >
                <CircularProgress style={{ margin: 32 }} />
              </Grid>
            )
            : (
              <ScalingChannelsList
                channels={channels}
                maxHeight={baseHeight - constants.sidebarHeight - constants.gutter}
              />
            )

        }
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
  }),
  loading: PropTypes.bool.isRequired
}

ChannelsPanel.defaultProps = {
  channels: Immutable.List(),
  loading: false
}

export default R.compose(
  React.memo,
  withContentRect('bounds')
)(ChannelsPanel)
