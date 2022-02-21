import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import NotificationsComponent from '../../../components/widgets/channelSettings/Notifications'
import channelSelectors from '../../../store/selectors/channel'
import appHandlers from '../../../store/handlers/app'
import contactsSelectors from '../../../store/selectors/contacts'
import { ModalName } from '../../../sagas/modals/modals.types'
import { Contact } from '../../../store/handlers/contacts'
import { useModal } from '../../hooks'

interface useNotificationsDataReturnType {
  channelData: Contact
}

export const useNotificationsData = (): useNotificationsDataReturnType => {
  const channel = useSelector(channelSelectors.channel).address
  const data = {
    channelData: useSelector(contactsSelectors.contact(channel))
  }
  return data
}

export const useNotificationsActions = () => {
  const dispatch = useDispatch()

  const openNotificationsTab = useCallback(() => {
    dispatch(appHandlers.actions.setModalTab('notifications'))
  }, [dispatch])

  return { openNotificationsTab }
}

export const Notifications = () => {
  const { channelData } = useNotificationsData()
  const { openNotificationsTab } = useNotificationsActions()

  const openSettingsModal = useModal(ModalName.accountSettingsModal)

  return (
    <NotificationsComponent
      channelData={channelData}
      openNotificationsTab={openNotificationsTab}
      openSettingsModal={openSettingsModal.handleOpen}
    />
  )
}

export default Notifications
