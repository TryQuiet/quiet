import React from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'
import { bindActionCreators } from 'redux'

import Grid from '@material-ui/core/Grid'
import contactsSelectors from '../../../store/selectors/contacts'
import directMessageSelectors from '../../../store/selectors/directMessageChannel'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import { actionCreators } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'
import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  channels: contactsSelectors.contacts(state).toList(),
  selected: directMessageSelectors.directMessageChannel(state),
  fundsLocked:
    channelSelectors.inputLocked(state) === INPUT_STATE.DISABLE ||
    channelSelectors.inputLocked(state) === INPUT_STATE.LOCKED
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModal: actionCreators.openModal('newMessage'),
      openDepositMonet: actionCreators.openModal('depositMoney')
    },
    dispatch
  )
export const DirectMessagesPanel = ({
  title,
  openModal,
  fundsLocked,
  openDepositMonet,
  ...props
}) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader title={title} action={fundsLocked ? openDepositMonet : openModal} tooltipText='Create new message' />
      </Grid>
      <Grid item>
        <BaseChannelsList directMessages {...props} />
      </Grid>
      <Grid item>
        <QuickActionButton text='New Message' action={fundsLocked ? openDepositMonet : openModal} />
      </Grid>
    </Grid>
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(
  React.memo(DirectMessagesPanel, (before, after) => {
    return (
      Immutable.is(before.channels, after.channels) && Immutable.is(before.selected, after.selected)
    )
  })
)
