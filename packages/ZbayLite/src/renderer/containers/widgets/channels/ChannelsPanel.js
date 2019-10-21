import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import Immutable from 'immutable'
import { bindActionCreators } from 'redux'

import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import channelsSelectors from '../../../store/selectors/channels'
import channelSelectors from '../../../store/selectors/channel'
import { actionCreators } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state),
  selected: channelSelectors.channelInfo(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openCreateModal: actionCreators.openModal('createChannel')
    },
    dispatch
  )
export const ChannelsPanel = ({ title, openCreateModal, ...props }) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader title={title} action={openCreateModal} tooltipText='Create new channel' />
      </Grid>
      <Grid item>
        <BaseChannelsList {...props} />
      </Grid>
      <Grid item>
        <QuickActionButton text='Add Channel' action={openCreateModal} />
      </Grid>
    </Grid>
  )
}
export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(
  React.memo(ChannelsPanel, (before, after) => {
    return (
      Immutable.is(before.channels, after.channels) &&
      Immutable.is(before.selected, after.selected) &&
      Object.is(before.contentRect, after.contentRect)
    )
  })
)
