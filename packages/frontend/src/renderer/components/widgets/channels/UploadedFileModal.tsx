import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import Modal from '../../ui/Modal/Modal'

const useStyles = makeStyles(() => ({
  image: {
    position: 'relative',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90vw',
    maxHeight: '90vh'
  },
  container: {
    position: 'absolute',
    left: '5vw',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '100%',
    height: '100%'
  }
}))

interface UploadedFileModalProps {
  open: boolean
  handleClose: () => void
}

const UploadedFileModalComponent: React.FC<UploadedFileModalProps> = ({
  open,
  handleClose
}) => {
  const classes = useStyles({})

  const uploadedFileModal = useModal(ModalName.uploadedFileModal)

  return (
    <Modal open={open} handleClose={handleClose}>
      <div className={classes.container}>
        {/* @ts-expect-error */}
        <img className={classes.image} src={uploadedFileModal.src} />
      </div>
    </Modal>
  )
}

export default UploadedFileModalComponent
