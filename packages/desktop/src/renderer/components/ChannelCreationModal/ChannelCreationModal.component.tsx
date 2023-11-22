import Modal from '../ui/Modal/Modal'
import React from 'react'
import SpinnerLoader from '../ui/Spinner/SpinnerLoader'
import { Grid } from '@mui/material'
import { styled } from '@mui/material/styles'

const PREFIX = 'ChannelCreationModalComponent'

const classes = {
    wrapper: `${PREFIX}wrapper`,
}

const StyledGrid = styled(Grid)(() => ({
    [`&.${classes.wrapper}`]: {},
}))

export interface ChannelCreationModalComponentProps {
    open: boolean
    handleClose: () => void
}

const ChannelCreationModalComponent: React.FC<ChannelCreationModalComponentProps> = ({ open, handleClose }) => {
    return (
        <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
            <StyledGrid container justifyContent='center' className={classes.wrapper}>
                <SpinnerLoader message='Channel recreation' />
            </StyledGrid>
        </Modal>
    )
}

export default ChannelCreationModalComponent
