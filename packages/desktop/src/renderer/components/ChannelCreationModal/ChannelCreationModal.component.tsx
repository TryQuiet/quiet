import Modal from '../ui/Modal/Modal'
import React from 'react'
import ActionProgress from '../ui/ActionProgress/ActionProgress'
import { Grid } from '@mui/material'
import { styled } from '@mui/material/styles'

/**
 * Recreating the general channel, as Progress-loading-template (Quiet Design
 * Library 0j7Nna9zWmfOSNmRmQK1Uh, 6049:26981): the bar and its status line in a
 * padded panel, not a spinner. The status keeps the app's own wording - the
 * library has no frame for this action.
 */

const PREFIX = 'ChannelCreationModalComponent'

const classes = {
  wrapper: `${PREFIX}wrapper`,
}

const StyledGrid = styled(Grid)(() => ({
  // Progress-loading-template (6049:26981) pads the panel by 24 on every side.
  [`&.${classes.wrapper}`]: {
    padding: 24,
  },
}))

export const CHANNEL_RECREATION_STATUS = 'Channel recreation'

export interface ChannelCreationModalComponentProps {
  open: boolean
  handleClose: () => void
}

const ChannelCreationModalComponent: React.FC<ChannelCreationModalComponentProps> = ({ open, handleClose }) => {
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
      <StyledGrid container justifyContent='center' className={classes.wrapper}>
        <ActionProgress status={CHANNEL_RECREATION_STATUS} data-testid={'channel-recreation-progress'} />
      </StyledGrid>
    </Modal>
  )
}

export default ChannelCreationModalComponent
