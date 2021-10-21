import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { publicChannels } from '@zbayapp/nectar'
import JoinChannelModalComponent from '../../../components/widgets/channels/JoinChannelModal'
import channelHandlers from '../../../store/handlers/channel'
import { IChannelInfo } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

const useJoinChannelData = () => {
  const modalName = 'joinChannel'
  const data = {
    publicChannels: useSelector(publicChannels.selectors.publicChannels),
    users: {},
    modalName
  }
  return data
}

export const useJoinChannelActions = () => {
  const dispatch = useDispatch()
  const actions = {
    joinChannel: (channel: IChannelInfo) => {
      dispatch(channelHandlers.epics.linkChannelRedirect(channel))
    }
  }
  return actions
}

export const JoinChannelModal = () => {
  const { publicChannels, users } = useJoinChannelData()
  const { joinChannel } = useJoinChannelActions()

  const modal = useModal(ModalName.joinChannel)

  return (
    <JoinChannelModalComponent
      publicChannels={publicChannels}
      joinChannel={joinChannel}
      // showNotification={showNotification}
      open={modal.open}
      users={users}
      handleClose={modal.handleClose}
    />
  )
}

export default JoinChannelModal
