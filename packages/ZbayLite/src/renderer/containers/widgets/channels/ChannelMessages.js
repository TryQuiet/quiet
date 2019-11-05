import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import offersSelectors from '../../../store/selectors/offers'

export const mapStateToProps = (state, { contactId, signerPubKey }) => {
  const offersMessages = offersSelectors.offer(contactId)(state)
  return {
    messages: contactId
      ? offersMessages
        ? offersSelectors.offerMessages(contactId, signerPubKey)(state)
        : contactsSelectors.directMessages(contactId, signerPubKey)(state)
      : channelSelectors.messages(signerPubKey)(state),
    channelId: channelSelectors.channelId(state)
  }
}

export const ChannelMessages = ({ className, messages, contactId, channelId, contentRect }) => {
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

export default connect(mapStateToProps)(
  React.memo(ChannelMessages, (before, after) => {
    return Immutable.is(before.messages, after.messages)
  })
)
