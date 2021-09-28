import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
// import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
// import queueMessages from '../../../store/selectors/messagesQueue'
import appSelectors from '../../../store/selectors/app'

export const mapStateToProps = (state, { contactId }) => {
  // const qMessages = queueMessages.queue(state)
  // const qDmMessages = dmQueueMessages.queue(state)
  const contact = contactsSelectors.contact(contactId)(state)
  return {
    // triggerScroll: qDmMessages.length + qMessages.length > 0,
    // qMessages: qMessages,
    // messages: contactsSelectors.directMessages(contactId)(state).visibleMessages,
    name: contact.username,
    channelId: channelSelectors.channelId(state),
    isInitialLoadFinished: appSelectors.isInitialLoadFinished(state),
    isConnected: contact.connected
  }
}

export const ChannelMessages = ({
  messages,
  contactId,
  channelId,
  contentRect,
  triggerScroll,
  isInitialLoadFinished,
  name,
  isConnected
}) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  useEffect(() => {
    setScrollPosition(-1)
  }, [channelId, contactId])
  useEffect(() => {
    if (triggerScroll) {
      setScrollPosition(-1)
    }
  }, [triggerScroll])
  return (
    <ChannelMessagesComponent
      isDM
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      contactId={contactId}
      contentRect={contentRect}
      isInitialLoadFinished={isInitialLoadFinished}
      name={name}
      isConnected={isConnected}
    />
  )
}

export default connect(mapStateToProps)(
  React.memo(ChannelMessages, (before, after) => {
    return (
      before.isInitialLoadFinished === after.isInitialLoadFinished &&
      Object.is(before.messages, after.messages)
    )
  })
)
