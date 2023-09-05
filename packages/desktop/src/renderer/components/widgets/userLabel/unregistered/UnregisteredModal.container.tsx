import React from 'react'
import { useModal } from '../../../../containers/hooks'
import { ModalName } from '../../../../sagas/modals/modals.types'
import UnregisteredModalComponent from './UnregisteredModal.component'

interface ModalArgs {
  username: string
}

const UnregisteredModalContainer = () => {
  const unregisteredModal = useModal<ModalArgs>(ModalName.unregisteredModal)
  return <UnregisteredModalComponent {...unregisteredModal} />
}

export default UnregisteredModalContainer
