import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'

export const mapStateToProps = (state, { contactId }) => {
  return {
    messages: contactId
      ? contactsSelectors.messages(contactId)(state)
      : channelSelectors.messages(state)
  }
}

export const ChannelMessages = ({ className, messages, loadMessages, loader }) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      loader={loader}
    />
  )
}

export default R.compose(
  connect(
    mapStateToProps
  ),
  React.memo
)(ChannelMessages)
