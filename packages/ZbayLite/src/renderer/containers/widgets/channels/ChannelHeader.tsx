import { useDispatch, useSelector } from 'react-redux'

import React, { useCallback } from 'react'
import ChannelHeader, { ChannelHeaderProps } from '../../../components/widgets/channels/ChannelHeader'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'

import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import notificationCenter from '../../../store/selectors/notificationCenter'
import { notificationFilterType } from '../../../../shared/static'

export const useChannelInputData = (contactId?: string) => {
  const contact = useSelector(contactsSelectors.contact(contactId))
  const channelData = useSelector(channelSelectors.data)
  const data = {
    channel: {
      name: contactId === 'general' ? 'zbay' : contact.username,
      address: contactId,
      displayableMessageLimit: 50
    },
    name: contact.username,
    members: useSelector(channelSelectors.channelParticipiants),
    mutedFlag:
      useSelector(notificationCenter.channelFilterById(
        channelData ? channelData.key : 'none'
      )) === notificationFilterType.MUTE
  }

  return data
}

export const useChannelInputActions = () => {
  const dispatch = useDispatch()

  const unmute = useCallback(() => {
    dispatch(notificationCenterHandlers.epics.setChannelsNotification(
      notificationFilterType.ALL_MESSAGES
    ))
  }, [dispatch])

  return { unmute }
}

export const ChannelHeaderContainer: React.FC<ChannelHeaderProps> = ({
  isRegisteredUsername,
  updateShowInfoMsg,
  directMessage,
  channelType,
  tab,
  setTab,
  channel,
  offer,
  mutedFlag,
  unmute,
  name,
  contactId
}
) => {
  channel = useChannelInputData(contactId).channel
  name = useChannelInputData(contactId).name
  mutedFlag = useChannelInputData(contactId).mutedFlag

  unmute = useChannelInputActions().unmute

  return (
    <ChannelHeader
      unmute={unmute}
      channel={channel}
      name={name}
      mutedFlag={mutedFlag}
      setTab={setTab}
      offer={offer}
      tab={tab}
      directMessage={directMessage}
      updateShowInfoMsg={updateShowInfoMsg}
      isRegisteredUsername={isRegisteredUsername}
      channelType={channelType}
    />
  )
}

export default ChannelHeaderContainer
