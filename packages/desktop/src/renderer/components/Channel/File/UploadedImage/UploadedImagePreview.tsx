import React from 'react'
import { styled } from '@mui/material/styles';

import { UseModalTypeWrapper } from '../../../../containers/hooks'
import Modal from '../../../ui/Modal/Modal'

const PREFIX = 'UploadedImagePreviewComponent';

const classes = {
  image: `${PREFIX}image`,
  container: `${PREFIX}container`
};

const StyledModal = styled(Modal)(() => ({
  [`& .${classes.image}`]: {
    position: 'relative',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90vw',
    maxHeight: '90vh'
  },

  [`& .${classes.container}`]: {
    position: 'absolute',
    left: '5vw',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '100%',
    height: '100%'
  }
}));

interface UploadedImagePreviewProps {
  open: boolean
  handleClose: () => void
  uploadedFileModal?: ReturnType<UseModalTypeWrapper<{
    src: string
  }>['types']>
}

const UploadedImagePreviewComponent: React.FC<UploadedImagePreviewProps> = ({
  open,
  handleClose,
  uploadedFileModal
}) => {


  return (
    <StyledModal open={open} handleClose={handleClose}>
      <div className={classes.container}>
        <img className={classes.image} src={uploadedFileModal?.src} />
      </div>
    </StyledModal>
  );
}

export default UploadedImagePreviewComponent
