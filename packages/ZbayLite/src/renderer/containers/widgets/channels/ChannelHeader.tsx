import { useDispatch, useSelector } from 'react-redux'

import React, { useCallback } from 'react'
import ChannelHeader, { ChannelHeaderProps } from '../../../components/widgets/channels/ChannelHeader'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'

import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import identitySelectors from '../../../store/selectors/identity'
import notificationCenter from '../../../store/selectors/notificationCenter'

import { messageType, notificationFilterType } from '../../../../shared/static'

export const useChannelInputData = (contactId?) => {
  const contact = useSelector(contactsSelectors.contact(contactId))
  const channelData = useSelector(channelSelectors.data)
  const data = {
    channel: {
      name: contactId === 'general' ? 'zbay' : contact.username,
      address: contactId
    },
    name: contact.username,
    userAddress: useSelector(identitySelectors.address),
    members: useSelector(channelSelectors.channelParticipiants),
    showAdSwitch: !!useSelector(contactsSelectors.messages(contactId))
      .find(msg => msg.type === messageType.AD),
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
  showAdSwitch,
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
  showAdSwitch = useChannelInputData(contactId).showAdSwitch
  mutedFlag = useChannelInputData(contactId).mutedFlag

  unmute = useChannelInputActions().unmute

  return (
    <ChannelHeader
      unmute={unmute}
      channel={channel}
      name={name}
      showAdSwitch={showAdSwitch}
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
