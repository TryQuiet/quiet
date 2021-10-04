import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import Grid from '@material-ui/core/Grid'
import contactsSelectors from '../../../store/selectors/contacts'
import SidebarHeader from '../../../components/ui/Sidebar/SidebarHeader'
import { actionCreators, ModalName } from '../../../store/handlers/modals'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'
import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  channels: contactsSelectors.contactsList(state),
  // unknownMessages: contactsSelectors.unknownMessages(state),
  selected: channelSelectors.channelInfo(state),
  // offers: contactsSelectors.offerList(state),
  selectedOffer: channelSelectors.channelInfo(state)
  // fundsLocked:
  //   channelSelectors.inputLocked(state) === INPUT_STATE.DISABLE ||
  //   channelSelectors.inputLocked(state) === INPUT_STATE.LOCKED
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModal: actionCreators.openModal(ModalName.newMessageSeparate)
    },
    dispatch
  )
export const DirectMessagesPanel = ({
  title,
  openModal,
  fundsLocked,
  ...props
}) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader
          title={title}
          action={openModal}
          tooltipText='Create new message'
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
      <Grid item>
        <QuickActionButton
          text='New Message'
          action={openModal}
        />
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
      Object.is(before.channels, after.channels) &&
      Object.is(before.selected, after.selected) &&
      Object.is(before.offers, after.offers) &&
      Object.is(before.selectedOffer, after.selectedOffer)
    )
  })
)
