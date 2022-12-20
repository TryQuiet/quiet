import React from 'react'
import { styled } from '@mui/material/styles'
import SpinnerLoader from '../ui/Spinner/SpinnerLoader'
import Modal from '../ui/Modal/Modal'

const PREFIX = 'LoadingPanelComponent'

const classes = {
  spinner: `${PREFIX}spinner`
}

const StyledSpinnerLoader = styled(SpinnerLoader)(() => ({
  top: '50%',
  position: 'relative',
  transform: 'translate(0, -50%)'
}))

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
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
      <StyledSpinnerLoader
        size={40}
        message={message}
        color={'black'}
      />
    </Modal>
  )
}

export default LoadingPanelComponent
