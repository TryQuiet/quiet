import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelComponent from '../../components/pages/Channel'

import channelHandlers from '../../store/handlers/channel'
import channelsSelectors from '../../store/selectors/channels'

export const mapStateToProps = state => ({
  generalChannelId: channelsSelectors.generalChannelId(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  loadChannel: channelHandlers.epics.loadChannel
}, dispatch)

// TODO: after enzyme starts supporting hooks write tests
const Channel = ({ loadChannel, generalChannelId, match }) => {
  useEffect(() => {
    if (match.params.id === 'general') {
      if (generalChannelId) {
        loadChannel(generalChannelId)
      }
    } else {
      loadChannel(match.params.id)
    }
  }, [match.params.id, generalChannelId])
  return (<ChannelComponent />)
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
