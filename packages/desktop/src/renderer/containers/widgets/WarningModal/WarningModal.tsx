import React from 'react'
import WarningModal from '../../../components/widgets/WarningModal/WarningModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

const Warning = () => {
  const modal = useModal(ModalName.warningModal)
  return <WarningModal {...modal} />
}

export default Warning
