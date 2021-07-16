import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import { bindActionCreators } from 'redux'

import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import contactsSelectors from '../../../store/selectors/contacts'
import channelSelectors from '../../../store/selectors/channel'
import { actionCreators } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'
import { Icon } from '../../../components/ui/Icon'
import SearchIcon from '../../../static/images/st-search.svg'

export const mapStateToProps = state => ({
  channels: contactsSelectors.channelsList(state),
  selected: channelSelectors.channelInfo(state)
  // fundsLocked:
  //   channelSelectors.inputLocked(state) === INPUT_STATE.DISABLE ||
  //   channelSelectors.inputLocked(state) === INPUT_STATE.LOCKED
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
      {/*
      <Grid item>
        <QuickActionButton
          text='Create Channel'
          action={fundsLocked ? openDepositMonet : openCreateModal}
        />
      </Grid>
      */}
      <Grid item>
        <QuickActionButton
          text='Find Channel'
          action={openJoinChannel}
          icon={<Icon src={SearchIcon} />}
        />
      </Grid>
    </Grid>
  )
}
export default R.compose(connect(mapStateToProps, mapDispatchToProps))(
  React.memo(ChannelsPanel, (before, after) => {
    return (
      Object.is(before.channels, after.channels) &&
      Object.is(before.selected, after.selected) &&
      Object.is(before.contentRect, after.contentRect) &&
      Object.is(before.offers, after.offers) &&
      Object.is(before.fundsLocked, after.fundsLocked)
    )
  })
)
