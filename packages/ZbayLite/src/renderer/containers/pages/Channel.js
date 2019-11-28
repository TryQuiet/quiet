import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelMapping'

import channelHandlers from '../../store/handlers/channel'
import channelsSelectors from '../../store/selectors/channels'
import directMessageHandlers from '../../store/handlers/directMessageChannel'

export const mapStateToProps = state => ({
  generalChannelId: channelsSelectors.generalChannelId(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadChannel: channelHandlers.epics.loadChannel,
      resetDirectMessageChannel: directMessageHandlers.actions.resetDirectMessageChannel
    },
    dispatch
  )

// TODO: after enzyme starts supporting hooks write tests
const Channel = ({ loadChannel, generalChannelId, match, resetDirectMessageChannel }) => {
  useEffect(
    () => {
      resetDirectMessageChannel()
      if (match.params.id === 'general') {
        if (generalChannelId) {
          loadChannel(generalChannelId)
        }
      } else {
        loadChannel(match.params.id)
      }
    },
    [match.params.id, generalChannelId]
  )
  return <ChannelComponent channelType={CHANNEL_TYPE.NORMAL} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Channel)
