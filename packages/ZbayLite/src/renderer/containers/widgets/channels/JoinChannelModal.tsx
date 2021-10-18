import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { publicChannels } from '@zbayapp/nectar'
import JoinChannelModalComponent from '../../../components/widgets/channels/JoinChannelModal'
import channelHandlers from '../../../store/handlers/channel'
import modalsHandlers from '../../../store/handlers/modals'
import modalsSelectors from '../../../store/selectors/modals'
import { IChannelInfo } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'

const useJoinChannelData = () => {
  const modalName = 'joinChannel'
  const data = {
    publicChannels: useSelector(publicChannels.selectors.publicChannels),
    users: {},
    open: useSelector(modalsSelectors.open(modalName)),
    modalName
  }
  return data
}

export const useJoinChannelActions = () => {
  const dispatch = useDispatch()
  const modalName = 'joinChannel'
  const actions = {
    joinChannel: (channel: IChannelInfo) => {
      dispatch(channelHandlers.epics.linkChannelRedirect(channel))
    },
    handleClose: () => {
      dispatch(modalsHandlers.closeModalHandler(modalName))
    }
  }
  return actions
}

export const JoinChannelModal = () => {
  const { publicChannels, open, users } = useJoinChannelData()
  const { joinChannel, handleClose } = useJoinChannelActions()

  return (
    <JoinChannelModalComponent
      publicChannels={publicChannels}
      joinChannel={joinChannel}
      // showNotification={showNotification}
      open={open}
      users={users}
      handleClose={handleClose}
    />
  )
}

export default JoinChannelModal
