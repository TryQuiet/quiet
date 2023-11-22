import React from 'react'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import ChannelCreationModalComponent from './ChannelCreationModal.component'

const ChannelCreationModal = () => {
    const channelCreationModal = useModal(ModalName.channelCreationModal)

    return <ChannelCreationModalComponent {...channelCreationModal} />
}

export default ChannelCreationModal
