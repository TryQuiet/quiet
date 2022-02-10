import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import NotificationsComponent from '../../../components/widgets/settings/Notifications'

interface useNotificationsDataReturnType {
  userFilterType: number
  userSound: number
}

export const useNotificationsData = (): useNotificationsDataReturnType => {
  const data = {
    userFilterType: null,
    userSound: null
  }
  return data
}

export const useNotificationsActions = (userFilterType: number, sound: number) => {
  const dispatch = useDispatch()

  const setUserNotification = useCallback(() => {
    // dispatch(notificationCenterHandlers.epics.setUserNotification(userFilterType))
  }, [dispatch, userFilterType])

  const setUserNotificationsSound = useCallback(() => {
    // dispatch(notificationCenterHandlers.epics.setUserNotificationsSound(sound))
  }, [dispatch, sound])

  return { setUserNotification, setUserNotificationsSound }
}

export const Notifications = () => {
  const { userFilterType, userSound } = useNotificationsData()
  const { setUserNotification, setUserNotificationsSound } = useNotificationsActions(userFilterType, userSound)

  return (
    <NotificationsComponent
      userFilterType={userFilterType}
      userSound={userSound}
      setUserNotification={setUserNotification}
      setUserNotificationsSound={setUserNotificationsSound}
    />
  )
}

export default Notifications
