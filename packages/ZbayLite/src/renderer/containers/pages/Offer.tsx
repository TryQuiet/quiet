import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelTypes'

import channelHandlers from '../../store/handlers/channel'
// import channelsSelectors from '../../store/selectors/channels'

export const mapStateToProps = (_state) => ({
  generalChannelId: 'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00'
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadChannel: channelHandlers.epics.loadChannel
    },
    dispatch
  )

// TODO: after enzyme starts supporting hooks write tests
const Channel = ({ loadChannel, match }) => {
  useEffect(
    () => {
      loadChannel(match.params.id)
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
