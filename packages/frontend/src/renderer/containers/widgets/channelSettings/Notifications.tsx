import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import NotificationsComponent from '../../../components/widgets/channelSettings/Notifications'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

interface useNotificationsDataReturnType {
  currentFilter: number
  channelData: any
}

export const useNotificationsData = (): useNotificationsDataReturnType => {
  const data = {
    currentFilter: null,
    channelData: null
  }
  return data
}

export const useNotificationsActions = (currentFilter: number) => {
  const dispatch = useDispatch()

  const setChannelsNotification = useCallback(() => {}, [dispatch, currentFilter])

  const openNotificationsTab = useCallback(() => {}, [dispatch])

  return { setChannelsNotification, openNotificationsTab }
}

export const Notifications = () => {
  const { channelData, currentFilter } = useNotificationsData()
  const { openNotificationsTab, setChannelsNotification } = useNotificationsActions(currentFilter)

  const openSettingsModal = useModal(ModalName.accountSettingsModal)

  return (
    <NotificationsComponent
      channelData={channelData}
      currentFilter={currentFilter}
      openNotificationsTab={openNotificationsTab}
      openSettingsModal={openSettingsModal.handleOpen}
      setChannelsNotification={setChannelsNotification}
    />
  )
}

export default Notifications
