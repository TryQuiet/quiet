import React from 'react'
import Modal from '../../../ui/Modal/Modal'

export interface UnregisteredModalComponentProps {
  open: boolean
  handleClose: () => void
}
const UnregisteredModalComponent: React.FC<UnregisteredModalComponentProps> = ({ handleClose, open }) => {
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      data-testid={'unregisteredModalComponent'}
      title={'Unregistered username'}
      isBold
      addBorder
    >
      <p>UnregisteredModalComponent</p>
    </Modal>
  )
}

export default UnregisteredModalComponent
