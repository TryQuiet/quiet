import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
import queueMessages from '../../../store/selectors/messagesQueue'
import { messageType } from '../../../zbay/messages'

export const mapStateToProps = (state, { signerPubKey }) => {
  const qMessages = queueMessages.queue(state)
  const qDmMessages = dmQueueMessages.queue(state)
  return {
    triggerScroll: qDmMessages.size + qMessages.size > 0,
    qMessages: qMessages,
    messages: channelSelectors.messages(signerPubKey)(state),
    channelId: channelSelectors.channelId(state)
  }
}

export const ChannelMessages = ({
  messages,
  tab,
  contactId,
  channelId,
  contentRect,
  triggerScroll
}) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  useEffect(
    () => {
      setScrollPosition(-1)
    },
    [channelId, contactId]
  )
  useEffect(
    () => {
      if (triggerScroll) {
        setScrollPosition(-1)
      }
    },
    [triggerScroll]
  )
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={tab === 0 ? messages : messages.filter(msg => msg.type === messageType.AD)}
      contactId={contactId}
      contentRect={contentRect}
    />
  )
}

export default connect(mapStateToProps)(
  React.memo(ChannelMessages, (before, after) => {
    return Immutable.is(before.messages, after.messages) && before.tab === after.tab
  })
)
