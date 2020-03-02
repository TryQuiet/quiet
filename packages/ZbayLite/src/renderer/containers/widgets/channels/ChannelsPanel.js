import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import Immutable from 'immutable'
import { bindActionCreators } from 'redux'

import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import channelsSelectors from '../../../store/selectors/channels'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import { actionCreators } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'
import MoreButton from '../../../components/widgets/sidebar/MoreButton'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state),
  selected: channelSelectors.channelInfo(state),

  fundsLocked:
    channelSelectors.inputLocked(state) === INPUT_STATE.DISABLE ||
    channelSelectors.inputLocked(state) === INPUT_STATE.LOCKED
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openCreateModal: actionCreators.openModal('createChannel'),
      openJoinChannel: actionCreators.openModal('joinChannel'),
      openDepositMonet: actionCreators.openModal('depositMoney')
    },
    dispatch
  )
export const ChannelsPanel = ({
  title,
  openCreateModal,
  openJoinChannel,
  fundsLocked,
  openDepositMonet,
  ...props
}) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader
          title={title}
          action={openCreateModal}
          tooltipText='Create new channel'
          actionTitle={openJoinChannel}
        />
      </Grid>
      <Grid item>
        <BaseChannelsList {...props} />
      </Grid>
      <Grid item>
        <MoreButton tooltipText='More channels' action={openJoinChannel} />
      </Grid>
      <Grid item>
        <QuickActionButton
          text='New Channel'
          action={fundsLocked ? openDepositMonet : openCreateModal}
        />
      </Grid>
    </Grid>
  )
}
export default R.compose(connect(mapStateToProps, mapDispatchToProps))(
  React.memo(ChannelsPanel, (before, after) => {
    return (
      Immutable.is(before.channels, after.channels) &&
      Immutable.is(before.selected, after.selected) &&
      Object.is(before.contentRect, after.contentRect) &&
      Immutable.is(before.offers, after.offers) &&
      Object.is(before.fundsLocked, after.fundsLocked)
    )
  })
)
