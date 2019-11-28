import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelMapping'

import channelHandlers from '../../store/handlers/channel'
import channelsSelectors from '../../store/selectors/channels'
import messagesSelectors from '../../store/selectors/messages'
import directMessageHandlers from '../../store/handlers/directMessageChannel'

export const mapStateToProps = (state, { match }) => ({
  generalChannelId: channelsSelectors.generalChannelId(state),
  msg: messagesSelectors.messageById(match.params.id.substring(0, 64))(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadOffer: channelHandlers.epics.loadOffer,
      resetDirectMessageChannel: directMessageHandlers.actions.resetDirectMessageChannel
    },
    dispatch
  )

// TODO: after enzyme starts supporting hooks write tests
const Channel = ({ loadOffer, match, resetDirectMessageChannel, msg }) => {
  useEffect(
    () => {
      resetDirectMessageChannel()
      loadOffer(match.params.id, match.params.address)
    },
    [match.params.id]
  )
  return <ChannelComponent channelType={CHANNEL_TYPE.OFFER} offer={match.params.id} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Channel)
