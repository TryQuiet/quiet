import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelComponent from '../../components/pages/Channel'

import channelHandlers from '../../store/handlers/channel'

export const mapDispatchToProps = dispatch => bindActionCreators({
  loadChannel: channelHandlers.epics.loadChannel
}, dispatch)

// TODO: after enzyme starts supporting hooks write tests
const Channel = ({ loadChannel, loadChannels, match }) => {
  useEffect(() => {
    loadChannel(match.params.id)
  }, [match.params.id])
  return (<ChannelComponent />)
}

export default connect(null, mapDispatchToProps)(Channel)
