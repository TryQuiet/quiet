import React from 'react'
import { useSelector } from 'react-redux'

import ChannelInfoComponent from '../../../components/widgets/channelSettings/ChannelInfo'
import channelSelector from '../../../store/selectors/channel'

interface useChannelInfoDataReturnTypes {
  initialValues: {
    updateChannelDescription: string
  }
}

export const useChannelInfoData = (): useChannelInfoDataReturnTypes => {
  const data = {
    initialValues: {
      updateChannelDescription: useSelector(channelSelector.channelDesription)
    }
  }
  return data
}

export const ChannelInfo = () => {
  const { initialValues } = useChannelInfoData()

  return (
    <ChannelInfoComponent
      initialValues={initialValues}
    />
  )
}

export default ChannelInfo
