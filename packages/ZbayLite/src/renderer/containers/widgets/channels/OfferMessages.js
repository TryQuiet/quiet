import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import offersSelectors from '../../../store/selectors/offers'
import usersSelectors from '../../../store/selectors/users'
import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
import queueMessages from '../../../store/selectors/messagesQueue'

export const mapStateToProps = (state, { offer, signerPubKey }) => {
  const qMessages = queueMessages.queue(state)
  const qDmMessages = dmQueueMessages.queue(state)
  return {
    triggerScroll: qDmMessages.size + qMessages.size > 0,
    qMessages: qMessages,
    messages: offersSelectors.offerMessages(offer, signerPubKey)(state),
    channelId: channelSelectors.channelId(state),
    username: usersSelectors.registeredUser(signerPubKey)(state)
  }
}

export const ChannelMessages = ({
  messages,
  offer,
  channelId,
  contentRect,
  triggerScroll,
  username
}) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  useEffect(() => {
    setScrollPosition(-1)
  }, [channelId, offer])
  useEffect(() => {
    if (triggerScroll) {
      setScrollPosition(-1)
    }
  }, [triggerScroll])
  const isOffer = messages.toJS()[0].sender.username !== username.nickname
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      contactId={offer}
      contentRect={contentRect}
      isOffer={isOffer}
    />
  )
}

export default connect(mapStateToProps)(
  React.memo(ChannelMessages, (before, after) => {
    return Immutable.is(before.messages, after.messages)
  })
)
