import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'

export const mapStateToProps = (state, { contactId, signerPubKey }) => {
  return {
    messages: contactId
      ? contactsSelectors.directMessages(contactId, signerPubKey)(state)
      : channelSelectors.messages(signerPubKey)(state)
  }
}

export const ChannelMessages = ({ className, messages, loadMessages, loader, contactId }) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      loader={loader}
      contactId={contactId}
    />
  )
}

export default R.compose(
  connect(
    mapStateToProps
  ),
  React.memo
)(ChannelMessages)
