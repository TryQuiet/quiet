import React from 'react'
import { styled } from '@mui/material/styles';
import SpinnerLoader from '../ui/Spinner/SpinnerLoader'
import Modal from '../ui/Modal/Modal'

const PREFIX = 'LoadingPanelComponent';

const classes = {
  spinner: `${PREFIX}spinner`
};

const StyledModal = styled(Modal)(() => ({
  [`& .${classes.spinner}`]: {
    top: '50%',
    position: 'relative',
    transform: 'translate(0, -50%)'
  }
}));

interface LoadingPanelComponentProps {
  open: boolean
  handleClose: () => void
  message: string
}

const LoadingPanelComponent: React.FC<LoadingPanelComponentProps> = ({
  open,
  handleClose,
  message
}) => {


  return (
    <StyledModal open={open} handleClose={handleClose} isCloseDisabled={true}>
      <SpinnerLoader
        size={40}
        message={message}
        color={'black'}
        className={classes.spinner}
      />
    </StyledModal>
  );
}

export default LoadingPanelComponent
