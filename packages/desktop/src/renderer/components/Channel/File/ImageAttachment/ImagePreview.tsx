import React from 'react'
import { styled } from '@mui/material/styles'

import { UseModalType } from '../../../../containers/hooks'
import Modal from '../../../ui/Modal/Modal'

const PREFIX = 'ImageAttachmentPreviewComponent'

const classes = {
  image: `${PREFIX}image`,
}

const StyledModalContent = styled('div')(() => ({
  position: 'absolute',
  left: '5vw',
  maxWidth: '90vw',
  maxHeight: '90vh',
  width: '100%',
  height: '100%',

  [`& .${classes.image}`]: {
    position: 'relative',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90vw',
    maxHeight: '90vh',
  },
}))

interface ImageAttachmentPreviewProps {
  open: boolean
  handleClose: () => void
  fileAttachmentModal?: UseModalType<{
    src: string
  }>
}

const ImageAttachmentPreviewComponent: React.FC<ImageAttachmentPreviewProps> = ({
  open,
  handleClose,
  fileAttachmentModal,
}) => {
  return (
    <Modal open={open} handleClose={handleClose}>
      <StyledModalContent>
        <img className={classes.image} src={fileAttachmentModal?.src} />
      </StyledModalContent>
    </Modal>
  )
}

export default ImageAttachmentPreviewComponent
