import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NotificationsOptions, NotificationsSounds, settings } from '@quiet/state-manager'

import { NotificationsComponent } from './NotificationsComponent'

interface useNotificationsDataReturnType {
  notificationsOption: NotificationsOptions
  notificationsSound: NotificationsSounds
}

export const useNotificationsData = (): useNotificationsDataReturnType => {
  const data = {
    notificationsOption: useSelector(settings.selectors.getNotificationsOption),
    notificationsSound: useSelector(settings.selectors.getNotificationsSound)
  }
  return data
}

export const useNotificationsActions = (notificationsOption: NotificationsOptions, notificationsSound: NotificationsSounds) => {
  const dispatch = useDispatch()

  const setNotificationsOption = useCallback((option: NotificationsOptions) => {
    dispatch(settings.actions.setNotificationsOption(option))
  }, [dispatch, notificationsOption])

  const setNotificationsSound = useCallback((sound: NotificationsSounds) => {
    dispatch(settings.actions.setNotificationsSound(sound))
  }, [dispatch, notificationsSound])

  return { setNotificationsOption, setNotificationsSound }
}

export const Notifications: FC = () => {
  const { notificationsOption, notificationsSound } = useNotificationsData()
  const { setNotificationsOption, setNotificationsSound } =
    useNotificationsActions(notificationsOption, notificationsSound)

  return (
    <NotificationsComponent
      notificationsOption={notificationsOption}
      notificationsSound={notificationsSound}
      setNotificationsOption={setNotificationsOption}
      setNotificationsSound={setNotificationsSound}
    />
  )
}
