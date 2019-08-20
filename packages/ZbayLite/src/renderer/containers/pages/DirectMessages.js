import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import directMessageChannel from '../../store/handlers/directMessageChannel'
import contactsHandlers from '../../store/handlers/contacts'
import ChannelComponent from '../../components/pages/Channel'

export const mapDispatchToProps = dispatch => bindActionCreators({
  loadRecipientAddress: directMessageChannel.actions.setDirectMessageRecipientAddress,
  loadRecipientUsername: directMessageChannel.actions.setDirectMessageRecipientUsername,
  cleanNewMessages: contactsHandlers.actions.cleanNewMessages
}, dispatch)

const DirectMessages = ({ match, loadRecipientUsername, loadRecipientAddress, cleanNewMessages }) => {
  loadRecipientAddress(match.params.id)
  loadRecipientUsername(match.params.username)
  cleanNewMessages({ contactAddress: match.params.id })
  return <ChannelComponent contactId={match.params.id} />
}

export default connect(null, mapDispatchToProps)(DirectMessages)
