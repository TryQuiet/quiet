import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelMessage from '../../../components/widgets/channels/ChannelMessage'
import operationsHandlers from '../../../store/handlers/operations'
import channelHandlers from '../../../store/handlers/channel'
import contactsHandlers from '../../../store/handlers/contacts'
import publicChannelsSelectors from '../../../store/selectors/publicChannels'
import usersSelectors from '../../../store/selectors/users'

export const mapStateToProps = state => ({
  publicChannels: publicChannelsSelectors.publicChannels(state),
  users: usersSelectors.users(state)
})

export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      onCancel: () => operationsHandlers.actions.removeOperation(ownProps.message.get('id')),
      onResend: () =>
        ownProps.contactId
          ? contactsHandlers.epics.resendMessage(ownProps.message.toJS())
          : channelHandlers.epics.resendMessage(ownProps.message.toJS()),
      onLinkedChannel: channelHandlers.epics.linkChannelRedirect,
      onLinkedUser: contactsHandlers.epics.linkUserRedirect
    },
    dispatch
  )
export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ChannelMessage)
