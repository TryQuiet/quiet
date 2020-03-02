import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelMessage from '../../../components/widgets/channels/ChannelMessage'
import channelHandlers from '../../../store/handlers/channel'
import contactsHandlers from '../../../store/handlers/contacts'
import publicChannelsSelectors from '../../../store/selectors/publicChannels'
import usersSelectors from '../../../store/selectors/users'
import whitelistSelectors from '../../../store/selectors/whitelist'
import { actionCreators } from '../../../store/handlers/modals'
import whitelistHandlers from '../../../store/handlers/whitelist'

export const mapStateToProps = state => ({
  publicChannels: publicChannelsSelectors.publicChannels(state),
  users: usersSelectors.users(state),
  allowAll: whitelistSelectors.allowAll(state),
  whitelisted: whitelistSelectors.whitelisted(state),
  autoload: whitelistSelectors.autoload(state)
})

export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      onResend: () =>
        ownProps.contactId
          ? contactsHandlers.epics.resendMessage(ownProps.message.toJS())
          : channelHandlers.epics.resendMessage(ownProps.message.toJS()),
      onLinkedChannel: channelHandlers.epics.linkChannelRedirect,
      onLinkedUser: contactsHandlers.epics.linkUserRedirect,
      openExternalLink: payload =>
        actionCreators.openModal('openexternallink', payload)(),
      addToWhitelist: whitelistHandlers.epics.addToWhitelist,
      setWhitelistAll: whitelistHandlers.epics.setWhitelistAll
    },
    dispatch
  )
export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps)
)(ChannelMessage)
