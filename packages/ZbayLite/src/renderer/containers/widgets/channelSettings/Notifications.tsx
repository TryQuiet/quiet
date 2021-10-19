import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import notificationCenterActions from '../../../store/handlers/notificationCenter'
import NotificationsComponent from '../../../components/widgets/channelSettings/Notifications'
import notificationCenterSelectors from '../../../store/selectors/notificationCenter'
import channelSelectors from '../../../store/selectors/channel'
import appHandlers from '../../../store/handlers/app'
import contactsSelectors from '../../../store/selectors/contacts'
import { actionCreators, ModalName } from '../../../store/handlers/modals'
import { Contact } from '../../../store/handlers/contacts'

interface useNotificationsDataReturnType {
  currentFilter: number
  channelData: Contact
}

export const useNotificationsData = (): useNotificationsDataReturnType => {
  const channel = useSelector(channelSelectors.channel).address
  const data = {
    currentFilter: useSelector(notificationCenterSelectors.channelFilterById(channel)),
    channelData: useSelector(contactsSelectors.contact(channel))
  }
  return data
}

export const useNotificationsActions = (currentFilter: number) => {
  const dispatch = useDispatch()

  const setChannelsNotification = useCallback(() => {
    dispatch(notificationCenterActions.epics.setChannelsNotification(currentFilter))
  }, [dispatch, currentFilter])

  const openNotificationsTab = useCallback(() => {
    dispatch(appHandlers.actions.setModalTab('notifications'))
  }, [dispatch])

  const openSettingsModal = useCallback(() => {
    dispatch(actionCreators.openModal(ModalName.accountSettingsModal))
  }, [dispatch])

  return { setChannelsNotification, openNotificationsTab, openSettingsModal }
}

export const Notifications = () => {
  const { channelData, currentFilter } = useNotificationsData()
  const { openNotificationsTab, openSettingsModal, setChannelsNotification } = useNotificationsActions(currentFilter)

  return (
    <NotificationsComponent
      channelData={channelData}
      currentFilter={currentFilter}
      openNotificationsTab={openNotificationsTab}
      openSettingsModal={openSettingsModal}
      setChannelsNotification={setChannelsNotification}
    />
  )
}

export default Notifications
