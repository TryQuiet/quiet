import React from 'react'

// import { MenuItem } from '../types'
import Modal from '../../ui/Modal'

export const CreateChannelModal = ({ open, handleClose }) => {
  return (
    <Modal open={open} handleClose={handleClose} title='Create channel' fullPage>
      <div>Create channel</div>
    </Modal>
  )
}

export default React.memo(CreateChannelModal)
