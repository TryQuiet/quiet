import React from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

const UserLabelContainer = () => {
  const duplicateModal = useModal(ModalName.duplicateModal)
  const unregisteredModal = useModal(ModalName.unregisteredModal)
  return <div>UserLabel.container</div>
}

export default UserLabelContainer
