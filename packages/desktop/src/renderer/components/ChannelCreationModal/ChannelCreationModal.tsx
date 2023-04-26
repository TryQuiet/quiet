import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { publicChannels } from '@quiet/state-manager'
import ChannelCreationModalComponent from './ChannelCreationModal.component'

const ChannelCreationModal = () => {
  const channelCreationModal = useModal(ModalName.channelCreationModal)
  const pendingGeneralChannelRecreation = useSelector(publicChannels.selectors.pendingGeneralChannelRecreation)

  useEffect(() => {
    if (pendingGeneralChannelRecreation) {
      channelCreationModal.handleOpen()
    } else {
      channelCreationModal.handleClose()
    }
  }, [pendingGeneralChannelRecreation])

  return <ChannelCreationModalComponent {...channelCreationModal} />
}

export default ChannelCreationModal
