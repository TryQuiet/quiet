import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import notificationCenterSlectors from '../../../store/selectors/notificationCenter'
import { notificationFilterType } from '../../../../shared/static'

interface useChannelHeaderDataReturnTypes {
  channel: {
    name: string
    address: string
    displayableMessageLimit: number
  }
  directMessage: boolean
  mutedFlag: boolean
}

export const useChannelHeaderData = (contact): useChannelHeaderDataReturnTypes => {
  const data = {
    channel: {
      name: contact.username,
      address: contact.id,
      displayableMessageLimit: 50
    },
    directMessage: true,
    mutedFlag:
      useSelector(notificationCenterSlectors.contactFilterByAddress(contact.address)) ===
      notificationFilterType.MUTE
  }
  return data
}

interface useChannelHeaderActionsReturnTypes {
  unmute: () => {}
}

export const useChannelHeaderActions = (): useChannelHeaderActionsReturnTypes => {
  const dispatch = useDispatch()
  const unmute = () =>
    dispatch(
      notificationCenterHandlers.epics.setContactNotification(notificationFilterType.ALL_MESSAGES)
    )

  return { unmute }
}

export const ChannelHeaderContainer = contact => {
  const data = useChannelHeaderData(contact)
  const { unmute } = useChannelHeaderActions()
  return (
    <ChannelHeader
      channelType={1}
      channel={data.channel}
      directMessage={data.directMessage}
      mutedFlag={data.mutedFlag}
      unmute={unmute}
    />
  )
}

export default ChannelHeaderContainer
