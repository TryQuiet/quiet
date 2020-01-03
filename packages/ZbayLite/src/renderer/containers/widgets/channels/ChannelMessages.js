import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import channelsSelectors from '../../../store/selectors/channels'
import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
import queueMessages from '../../../store/selectors/messagesQueue'
import { messageType } from '../../../zbay/messages'

export const mapStateToProps = (state, { signerPubKey }) => {
  const qMessages = queueMessages.queue(state)
  const qDmMessages = dmQueueMessages.queue(state)
  return {
    triggerScroll: qDmMessages.size + qMessages.size > 0,
    qMessages: qMessages,
    channelData:
      channelsSelectors.channelById(channelSelectors.channelId(state))(state) ||
      Immutable.fromJS({ keys: {} }),
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
  triggerScroll,
  channelData
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
  const isOwner = !!channelData.get('keys').get('sk')
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={
        tab === 0
          ? messages
          : messages.filter(msg => msg.type === messageType.AD)
      }
      contactId={contactId}
      contentRect={contentRect}
      isOwner={isOwner}
    />
  )
}

export default connect(mapStateToProps)(
  React.memo(ChannelMessages, (before, after) => {
    return (
      Immutable.is(before.messages, after.messages) && before.tab === after.tab
    )
  })
)
