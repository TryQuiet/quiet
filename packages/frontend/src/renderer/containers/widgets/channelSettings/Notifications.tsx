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

export const useNotificationsActions = () => {
  const dispatch = useDispatch()

  const openNotificationsTab = useCallback(() => {}, [dispatch])

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
