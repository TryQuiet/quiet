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
import offersSelectors from '../../../store/selectors/offers'
import { actionCreators } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state),
  selected: channelSelectors.channelInfo(state),
  offers: offersSelectors.filteredOffers(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openCreateModal: actionCreators.openModal('createChannel'),
      openJoinChannel: actionCreators.openModal('joinChannel')
    },
    dispatch
  )
export const ChannelsPanel = ({ title, openCreateModal, openJoinChannel, ...props }) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader title={title} action={openJoinChannel} tooltipText='Create new channel' />
      </Grid>
      <Grid item>
        <BaseChannelsList {...props} />
      </Grid>
      <Grid item>
        <QuickActionButton text='Join Channel' action={openJoinChannel} />
        <QuickActionButton text='New Channel' action={openCreateModal} />
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
      Object.is(before.contentRect, after.contentRect) &&
      Immutable.is(before.offers, after.offers)
    )
  })
)
