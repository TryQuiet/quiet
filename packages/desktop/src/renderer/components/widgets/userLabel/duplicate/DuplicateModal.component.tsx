import React from 'react'
import Modal from '../../../ui/Modal/Modal'

export interface DuplicateModalComponentProps {
  open: boolean
  handleClose: () => void
}
const DuplicateModalComponent: React.FC<DuplicateModalComponentProps> = ({ handleClose, open }) => {
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      data-testid={'duplicateModalComponent'}
      title={'Warning!'}
      isBold
      addBorder
    >
      <p>DuplicateModalComponent</p>
    </Modal>
  )
}

export default DuplicateModalComponent
