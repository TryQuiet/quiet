import React from 'react'
import { useSelector } from 'react-redux'

import ChannelInfoModal from '../../../components/widgets/channels/ChannelInfoModal'
import contactsSelectors from '../../../store/selectors/contacts'
import channelSelectors from '../../../store/selectors/channel'

const useChannelMessagesInfoData = () => {
  const channel = useSelector(channelSelectors.channel)
  const data = {
    channelData: useSelector(contactsSelectors.directMessagesContact(channel.address)),
    directMessage: true
  }

  return data
}

const ChannelInfoModalContainer = () => {
  const data = useChannelMessagesInfoData()

  return <ChannelInfoModal channelData={data.channelData} directMessage={data.directMessage} />
}

export default ChannelInfoModalContainer
