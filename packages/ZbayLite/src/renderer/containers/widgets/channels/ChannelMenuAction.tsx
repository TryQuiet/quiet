import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ChannelMenuAction from '../../../components/widgets/channels/ChannelMenuAction'
import channelSelectors from '../../../store/selectors/channel'
import notificationCenterSelectors from '../../../store/selectors/notificationCenter'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import appHandlers from '../../../store/handlers/app'
import { notificationFilterType } from '../../../../shared/static'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

const filterToText = {
  [notificationFilterType.ALL_MESSAGES]: 'Every new message',
  [notificationFilterType.MENTIONS]: 'Just @mentions',
  [notificationFilterType.NONE]: 'Nothing',
  [notificationFilterType.MUTE]: 'Muted'
}

const useChannelMenuActionActions = () => {
  const dispatch = useDispatch()
  const onMute = () =>
    dispatch(notificationCenterHandlers.epics.setChannelsNotification(notificationFilterType.MUTE))
  const onUnmute = () =>
    dispatch(
      notificationCenterHandlers.epics.setChannelsNotification(notificationFilterType.ALL_MESSAGES)
    )
  const onDelete = () => {}
  const openNotificationsTab = () => dispatch(appHandlers.actions.setModalTab('notifications'))

  return { onMute, onUnmute, onDelete, openNotificationsTab }
}

const useChannelMenuActionData = () => {
  const channel = useSelector(channelSelectors.channel)
  const channelData = useSelector(channelSelectors.data)
  const data = {
    mutedFlag:
      useSelector(
        notificationCenterSelectors.channelFilterById(channelData ? channelData.address : 'none')
      ) === notificationFilterType.MUTE,

    notificationFilter:
      filterToText[
        useSelector(
          notificationCenterSelectors.channelFilterById(channel ? channel.address : 'none')
        )
      ]
  }
  return data
}

const ChannelMenuActionContainer = () => {
  const channelInfoModal = useModal(ModalName.channelInfo)
  const channelSettingsModal = useModal(ModalName.channelSettingsModal)

  const { openNotificationsTab, onMute, onUnmute, onDelete } = useChannelMenuActionActions()
  const { mutedFlag, notificationFilter } = useChannelMenuActionData()

  return (
    <ChannelMenuAction
      onSettings={channelSettingsModal.handleOpen}
      onInfo={channelInfoModal.handleOpen}
      onMute={onMute}
      onUnmute={onUnmute}
      onDelete={onDelete}
      mutedFlag={mutedFlag}
      notificationFilter={notificationFilter}
      openNotificationsTab={openNotificationsTab}
    />
  )
}

export default ChannelMenuActionContainer
