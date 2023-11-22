import React from 'react'
import { useModal } from '../../../../containers/hooks'
import { ModalName } from '../../../../sagas/modals/modals.types'
import DuplicateModalComponent from './DuplicateModal.component'

const DuplicateModalContainer = () => {
    const duplicateModal = useModal(ModalName.duplicatedUsernameModal)
    return <DuplicateModalComponent {...duplicateModal} />
}

export default DuplicateModalContainer
