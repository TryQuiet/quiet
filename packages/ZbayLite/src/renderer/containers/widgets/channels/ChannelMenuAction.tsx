import React from 'react'
import { useDispatch } from 'react-redux'
import ChannelMenuAction from '../../../components/widgets/channels/ChannelMenuAction'
import appHandlers from '../../../store/handlers/app'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

const useChannelMenuActionActions = () => {
  const dispatch = useDispatch()
  const onDelete = () => { }
  const openNotificationsTab = () => dispatch(appHandlers.actions.setModalTab('notifications'))

  return { onDelete, openNotificationsTab }
}

const useChannelMenuActionData = () => {
  const data = {
    mutedFlag: false,
    notificationFilter: ''
  }
  return data
}

const ChannelMenuActionContainer = () => {
  const channelInfoModal = useModal(ModalName.channelInfo)
  const channelSettingsModal = useModal(ModalName.channelSettingsModal)

  const { openNotificationsTab, onDelete } = useChannelMenuActionActions()
  const { mutedFlag, notificationFilter } = useChannelMenuActionData()

  return (
    <ChannelMenuAction
      onSettings={channelSettingsModal.handleOpen}
      onInfo={channelInfoModal.handleOpen}
      onDelete={onDelete}
      mutedFlag={mutedFlag}
      notificationFilter={notificationFilter}
      openNotificationsTab={openNotificationsTab}
    />
  )
}

export default ChannelMenuActionContainer
