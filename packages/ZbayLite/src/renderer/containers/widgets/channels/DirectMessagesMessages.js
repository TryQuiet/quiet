import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
import queueMessages from '../../../store/selectors/messagesQueue'
import appSelectors from '../../../store/selectors/app'

export const mapStateToProps = (state, { contactId, signerPubKey }) => {
  const qMessages = queueMessages.queue(state)
  const qDmMessages = dmQueueMessages.queue(state)
  return {
    triggerScroll: qDmMessages.size + qMessages.size > 0,
    qMessages: qMessages,
    messages: contactsSelectors.directMessages(contactId, signerPubKey)(state),
    channelId: channelSelectors.channelId(state),
    isInitialLoadFinished: appSelectors.isInitialLoadFinished(state)
  }
}

export const ChannelMessages = ({
  messages,
  contactId,
  channelId,
  contentRect,
  triggerScroll,
  isInitialLoadFinished
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
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      contactId={contactId}
      contentRect={contentRect}
      isInitialLoadFinished={isInitialLoadFinished}
    />
  )
}

export default connect(mapStateToProps)(
  React.memo(ChannelMessages, (before, after) => {
    return (
      before.isInitialLoadFinished === after.isInitialLoadFinished &&
      Immutable.is(before.messages, after.messages)
    )
  })
)
