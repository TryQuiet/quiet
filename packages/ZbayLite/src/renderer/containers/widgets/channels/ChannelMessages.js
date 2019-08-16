import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import messagesHandlers from '../../../store/handlers/messages'
import contactsHandlers from '../../../store/handlers/contacts'
import { useInterval } from '../../hooks'

export const mapStateToProps = (state, { contactId }) => {
  return {
    messages: contactId
      ? contactsSelectors.messages(contactId)(state)
      : channelSelectors.messages(state)
  }
}

export const mapDispatchToProps = (dispatch, { contactId }) => {
  return bindActionCreators(
    {
      fetchMessages: contactId
        ? contactsHandlers.epics.fetchMessages
        : messagesHandlers.epics.fetchMessages
    },
    dispatch
  )
}
export const ChannelMessages = ({ className, messages, loadMessages, fetchMessages, loader }) => {
  useInterval(fetchMessages, 15000)
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
    mapStateToProps,
    mapDispatchToProps
  ),
  React.memo
)(ChannelMessages)
