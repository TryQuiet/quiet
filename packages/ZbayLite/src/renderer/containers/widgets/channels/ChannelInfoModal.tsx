import channelSelectors from '../../../store/selectors/channel'
import ChannelInfoModal, { ChannelInfoModalProps } from '../../../components/widgets/channels/ChannelInfoModal'
import { useSelector } from 'react-redux'
import React from 'react'

export const useChannelInfoData = () => {
  const data = {
    shareUri: useSelector(channelSelectors.shareableUri)
  }
  return data
}

export const ChannelInfo: React.FC<ChannelInfoModalProps> = ({
  channel,
  channelData,
  shareUri,
  open,
  handleClose,
  directMessage
}
) => {
  return (
    <ChannelInfoModal
      channel={channel}
      channelData={channelData}
      shareUri={shareUri}
      open={open}
      handleClose={handleClose}
      directMessage={directMessage}
    />
  )
}

export default ChannelInfo
