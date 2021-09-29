import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import { bindActionCreators } from 'redux'

import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import SidebarHeader from '../../../components/ui/Sidebar/SidebarHeader'
import contactsSelectors from '../../../store/selectors/contacts'
import channelSelectors from '../../../store/selectors/channel'
import { actionCreators, ModalName } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'
import { Icon } from '../../../components/ui/Icon/Icon'
import SearchIcon from '../../../static/images/st-search.svg'

// const useData = () => {
//   const data = {
//     channels: useSelector(publicChannels.selectors.publicChannels),
//     selected: useSelector(publicChannels.selectors.currentChannel)
//   }
//   return data
// }

export const mapStateToProps = state => ({
  channels: contactsSelectors.channelsList(state),
  selected: channelSelectors.channelInfo(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openCreateModal: actionCreators.openModal(ModalName.createChannel),
      openJoinChannel: actionCreators.openModal(ModalName.joinChannel),
      openDepositMonet: actionCreators.openModal(ModalName.depositMoney)
    },
    dispatch
  )

export const ChannelsPanel = ({
  title,
  openCreateModal,
  openJoinChannel,
  fundsLocked,
  openDepositMonet,
  // eslint-disable-next-line
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
        <BaseChannelsList
          channels={props.channels}
          unknownMessages={props.unknownMessages}
          directMessages={props.directMessages}
          selected={props.selected}
        />
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
