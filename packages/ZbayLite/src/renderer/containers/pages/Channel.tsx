import React, { useEffect } from 'react'
import { useRouteMatch } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'

import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelTypes'

import channelHandlers from '../../store/handlers/channel'
import channelsSelectors from '../../store/selectors/channels'
import electronStore from '../../../shared/electronStore'

const Channel = () => {
  const generalChannelId = useSelector(channelsSelectors.generalChannelId)
  const dispatch = useDispatch()
  const match = useRouteMatch<{ id: string }>()

  useEffect(
    () => {
      const loadChannel = (key: string) => {
        dispatch(channelHandlers.epics.loadChannel(key))
      }

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

export default Channel
