import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelTypes'

import channelHandlers from '../../store/handlers/channel'
import channelsSelectors from '../../store/selectors/channels'
import electronStore from '../../../shared/electronStore'

export const mapStateToProps = state => ({
  generalChannelId: channelsSelectors.generalChannelId(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadChannel: channelHandlers.epics.loadChannel
    },
    dispatch
  )

const Channel = ({ loadChannel, generalChannelId, match }) => {
  useEffect(
    () => {
      if (match.params.id === 'general') {
        if (generalChannelId && electronStore.get('generalChannelInitialized')) {
          loadChannel(generalChannelId)
        }
      } else {
        loadChannel(match.params.id)
      }
    },
    [match.params.id, generalChannelId]
  )
  return <ChannelComponent channelType={CHANNEL_TYPE.NORMAL} contactId={match.params.id} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Channel)
