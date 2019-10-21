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

export const mapStateToProps = state => ({
  channels: contactsSelectors.contacts(state).toList(),
  selected: directMessageSelectors.directMessageChannel(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModal: actionCreators.openModal('sendMoney')
    },
    dispatch
  )
export const DirectMessagesPanel = ({ title, openModal, ...props }) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader title={title} action={openModal} tooltipText='Create new message' />
      </Grid>
      <Grid item>
        <BaseChannelsList directMessages {...props} />
      </Grid>
      <Grid item>
        <QuickActionButton text='New Message' action={openModal} />
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
