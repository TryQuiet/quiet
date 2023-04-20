import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { publicChannels } from '@quiet/state-manager'
import ChannelCreationModalComponent from './ChannelCreationModal.component'

const ChannelCreationModal = () => {
  const channelCreationModal = useModal(ModalName.channelCreationModal)
  const isGeneralRecreation = useSelector(publicChannels.selectors.isGeneralRecreation)

  useEffect(() => {
    if (isGeneralRecreation) {
      channelCreationModal.handleOpen()
    } else {
      channelCreationModal.handleClose()
    }
  }, [isGeneralRecreation])

  return <ChannelCreationModalComponent {...channelCreationModal} />
}

export default ChannelCreationModal
