import React from 'react'
import { useModal } from '../../../../containers/hooks'
import { ModalName } from '../../../../sagas/modals/modals.types'
import UnregisteredModalComponent from './UnregisteredModal.component'

const UnregisteredModalContainer = () => {
  const unregisteredModal = useModal(ModalName.unregisteredModal)
  return <UnregisteredModalComponent {...unregisteredModal} />
}

export default UnregisteredModalContainer
