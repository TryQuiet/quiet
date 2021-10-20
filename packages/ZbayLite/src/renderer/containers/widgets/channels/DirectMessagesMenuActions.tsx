import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import ChannelMenuActionComponent from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators, ModalName } from '../../../store/handlers/modals'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import { notificationFilterType } from '../../../../shared/static'

export const useChannelMenuActionActions = () => {
  const dispatch = useDispatch()

  const onInfo = useCallback(() => {
    dispatch(actionCreators.openModal(ModalName.channelInfo))
  }, [dispatch])

  const onMute = useCallback(() => {
    dispatch(notificationCenterHandlers.epics.setContactNotification(notificationFilterType.MUTE))
  }, [dispatch])

  return { onMute, onInfo }
}

export const ChannelMenuAction = ({ onDelete, ...props }) => {
  const { onInfo, onMute } = useChannelMenuActionActions()

  return (
    <ChannelMenuActionComponent
      onInfo={onInfo}
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
