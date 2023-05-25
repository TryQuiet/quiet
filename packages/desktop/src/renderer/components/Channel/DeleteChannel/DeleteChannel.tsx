import React, { FC, useCallback } from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useSelector, useDispatch } from 'react-redux'
import { publicChannels } from '@quiet/state-manager'
import DeleteChannelComponent from './DeleteChannelComponent'

export const DeleteChannel: FC = () => {
  const modal = useModal(ModalName.deleteChannel)

  const channel = useSelector(publicChannels.selectors.currentChannel)

  const dispatch = useDispatch()

  const deleteChannel = useCallback(() => {
    dispatch(publicChannels.actions.deleteChannel({ channelId: channel.id }))
    modal.handleClose() // Close self
  }, [modal])

  return <DeleteChannelComponent channelName={channel?.name} deleteChannel={deleteChannel} {...modal} />
}

export default DeleteChannel
