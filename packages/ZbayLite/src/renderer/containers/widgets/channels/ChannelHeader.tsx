import { useSelector } from 'react-redux'

import React from 'react'
import ChannelHeader, { ChannelHeaderProps } from '../../../components/widgets/channels/ChannelHeader'
import { publicChannels } from '@zbayapp/nectar'

export const useChannelHeaderData = (contactId: string) => {
  const data = {
    channel: {
      name: useSelector(publicChannels.selectors.currentChannel),
      address: contactId,
      displayableMessageLimit: 50
    },
    mutedFlag: false
  }

  return data
}

export const ChannelHeaderContainer: React.FC<ChannelHeaderProps> = ({
  updateShowInfoMsg,
  directMessage,
  channelType,
  tab,
  setTab,
  channel,
  mutedFlag,
  unmute,
  contactId
}
) => {
  channel = useChannelHeaderData(contactId).channel
  mutedFlag = useChannelHeaderData(contactId).mutedFlag
  return (
    <ChannelHeader
      unmute={unmute}
      channel={channel}
      mutedFlag={mutedFlag}
      setTab={setTab}
      tab={tab}
      directMessage={directMessage}
      updateShowInfoMsg={updateShowInfoMsg}
      channelType={channelType}
    />
  )
}

export default ChannelHeaderContainer
