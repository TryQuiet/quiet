import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import ChannelMenuActionComponent from '../../../components/widgets/channels/ChannelMenuAction'
import { ModalName } from '../../../sagas/modals/modals.types'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import { notificationFilterType } from '../../../../shared/static'
import { useModal } from '../../hooks'

export const useChannelMenuActionActions = () => {
  const dispatch = useDispatch()

  const onMute = useCallback(() => {
    dispatch(notificationCenterHandlers.epics.setContactNotification(notificationFilterType.MUTE))
  }, [dispatch])

  return { onMute }
}

export const ChannelMenuAction = ({ onDelete, ...props }) => {
  const { onMute } = useChannelMenuActionActions()

  const onInfo = useModal(ModalName.channelInfo)

  return (
    <ChannelMenuActionComponent
      onInfo={onInfo.handleOpen}
      onMute={onMute}
      onDelete={onDelete}
      onSettings={props.onSettings}
      onUnmute={props.onUnmute}
      mutedFlag={props.mutedFlag}
      disableSettings={props.disableSettings}
      notificationFilter={props.notificationFilter}
      openNotificationsTab={props.openNotificationsTab}
    />
  )
}

export default ChannelMenuAction
