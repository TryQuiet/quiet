import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelsPanelComponent from '../../../components/widgets/channels/ChannelsPanel'

import channelsSelectors from '../../../store/selectors/channels'
import messagesHandlers from '../../../store/handlers/messages'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state),
  loader: channelsSelectors.loader(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetchChannelsMessages: messagesHandlers.epics.fetchMessages
    },
    dispatch
  )
}

export const ChannelsPanel = ({ fetchChannelsMessages, ...props }) => {
  useInterval(fetchChannelsMessages, 15000)
  return <ChannelsPanelComponent {...props} />
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelsPanel)
