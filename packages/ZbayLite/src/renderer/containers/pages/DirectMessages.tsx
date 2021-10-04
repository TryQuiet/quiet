import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import channelHandlers from '../../store/handlers/channel'
import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelTypes'

const useDirectMessagesActions = () => {
  const dispatch = useDispatch()
  const loadChannel = (key: string) => dispatch(channelHandlers.epics.loadChannel(key))
  return { loadChannel }
}

const DirectMessages = ({ match }) => {
  const { loadChannel } = useDirectMessagesActions()

  useEffect(() => {
    loadChannel(match.params.username)
  }, [match.params.username])
  return (
    <ChannelComponent channelType={CHANNEL_TYPE.DIRECT_MESSAGE} contactId={match.params.username} />
  )
}

export default DirectMessages
