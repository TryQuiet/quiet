import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import RootRef from '@material-ui/core/RootRef'
import { withContentRect } from 'react-measure'
import Immutable from 'immutable'

import ChannelsPanelComponent from '../../../components/widgets/channels/ChannelsPanel'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import AddChannelAction from './AddChannelAction'
import channelsSelectors from '../../../store/selectors/channels'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state),
  selected: channelSelectors.channelInfo(state)
})

export const ChannelsPanel = ({ measureRef, ...props }) => {
  return (
    <RootRef rootRef={measureRef}>
      <Grid container item xs direction='column'>
        <SidebarHeader title='Channels' actions={[<AddChannelAction key='create-channel' />]} />
        <ChannelsPanelComponent {...props} />
      </Grid>
    </RootRef>
  )
}
export default R.compose(
  withContentRect('bounds'),
  connect(mapStateToProps)
)(
  React.memo(ChannelsPanel, (before, after) => {
    return (
      Immutable.is(before.channels, after.channels) &&
      Immutable.is(before.selected, after.selected) &&
      Object.is(before.contentRect, after.contentRect)
    )
  })
)
