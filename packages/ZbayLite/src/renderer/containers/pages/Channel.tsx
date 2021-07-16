import React, { useEffect } from 'react'
import { useRouteMatch } from 'react-router'
import { useDispatch } from 'react-redux'

import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelTypes'

import channelHandlers from '../../store/handlers/channel'
import electronStore from '../../../shared/electronStore'

export const useChannelData = () => {
  const data = {
    generalChannelId: 'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00'
  }
  return data
}

export const useChannelActions = () => {
  const dispatch = useDispatch()
  const loadChannel = (key: string) => {
    dispatch(channelHandlers.epics.loadChannel(key))
  }
  return { loadChannel }
}

const Channel = () => {
  const { generalChannelId } = useChannelData()
  const { loadChannel } = useChannelActions()
  const match = useRouteMatch<{ id: string }>()

  useEffect(() => {
    if (match.params.id === 'general') {
      if (generalChannelId && electronStore.get('generalChannelInitialized')) {
        loadChannel(generalChannelId)
      }
    } else {
      loadChannel(match.params.id)
    }
  }, [match.params.id, generalChannelId])

  return <ChannelComponent channelType={CHANNEL_TYPE.NORMAL} contactId={match.params.id} />
}

export default Channel
