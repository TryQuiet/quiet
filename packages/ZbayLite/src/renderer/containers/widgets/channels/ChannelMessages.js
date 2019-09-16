import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'

export const mapStateToProps = (state, { contactId, signerPubKey }) => {
  return {
    messages: contactId
      ? contactsSelectors.directMessages(contactId, signerPubKey)(state)
      : channelSelectors.messages(signerPubKey)(state),
    channelId: channelSelectors.channelId(state)
  }
}

export const ChannelMessages = ({
  className,
  messages,
  contactId,
  channelId,
  contentRect
}) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  useEffect(
    () => {
      setScrollPosition(-1)
    },
    [channelId, contactId]
  )
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      contactId={contactId}
      contentRect={contentRect}
    />
  )
}

export default R.compose(
  connect(mapStateToProps),
  React.memo
)(ChannelMessages)
