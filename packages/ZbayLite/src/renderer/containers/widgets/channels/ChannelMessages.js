import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import messagesHandlers from '../../../store/handlers/messages'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  messages: channelSelectors.messages(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchMessages: messagesHandlers.epics.fetchMessages
    },
    dispatch
  )

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
