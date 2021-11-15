import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ChannelContent from '../../../components/widgets/channels/ChannelContent'
import mentionsSelectors from '../../../store/selectors/mentions'
import mentionsHandlers from '../../../store/handlers/mentions'

import { CHANNEL_TYPE } from '../../../components/pages/ChannelTypes'
import { INPUT_STATE } from '../../../components/widgets/channels/ChannelInput/InputState.enum'
import { publicChannels } from '@zbayapp/nectar'

export const useChannelContentData = () => {
  const data = {
    inputState: INPUT_STATE.AVAILABLE,
    mentions: useSelector(mentionsSelectors.mentions),
    currentChannelAddress: useSelector(publicChannels.selectors.currentChannel)
  }
  return data
}

export const useChannelContentActions = () => {
  const dispatch = useDispatch()

  const removeMention = (nickname: string) =>
    dispatch(mentionsHandlers.epics.removeMention(nickname))

  return { removeMention }
}
const ChannelContentContainer = ({
  channelType,
  tab
}: {
  channelType: CHANNEL_TYPE
  tab: number
}) => {
  const { mentions, currentChannelAddress } = useChannelContentData()
  const { removeMention } = useChannelContentActions()

  return (
    <ChannelContent
      mentions={mentions as any}
      contactId={currentChannelAddress}
      removeMention={removeMention}
      contentRect={''}
      channelType={channelType}
      tab={tab}
    />
  )
}

export default ChannelContentContainer
