import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import channelHandlers from '../../../store/handlers/channel'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  messages: channelSelectors.messages(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  loadMessages: channelHandlers.epics.loadMessages
}, dispatch)

export const ChannelMessages = ({ className, messages, loadMessages, loader }) => {
  useInterval(loadMessages, 15000)
  return (
    <ChannelMessagesComponent messages={messages} loader={loader} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelMessages)
