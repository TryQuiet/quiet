import React from 'react'
import { styled } from '@mui/material/styles'

import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import Modal from '../ui/Modal/Modal'
import GlobeImg from '../../static/images/onboarding/joining-globe-2x.png'

/**
 * Clearing a failed admission did not work, so the join cannot continue and
 * there is nothing to show progress for. This is a state, not a transport, so
 * it is drawn once here rather than twice inside the Tor and server progress
 * screens: it takes the same shell and the same globe, and replaces the bar
 * with the reason and a retry.
 *
 * The copy and the retry are develop's, unchanged — the rtl tests press
 * `retry-admission-reset` and read this heading.
 */

const PREFIX = 'ResetFailedPanel'

const classes = {
  root: `${PREFIX}root`,
  contentWrapper: `${PREFIX}contentWrapper`,
  image: `${PREFIX}image`,
  title: `${PREFIX}title`,
  text: `${PREFIX}text`,
}

/** The globe, drawn at the same 126x120 as the progress screens (6110:27595). */
const GLOBE_WIDTH = 126
const GLOBE_HEIGHT = 120

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    width: '100%',
  },
  [`& .${classes.contentWrapper}`]: {
    maxWidth: 311,
    gap: theme.spacing(4),
  },
  [`& .${classes.image}`]: {
    width: GLOBE_WIDTH,
    height: GLOBE_HEIGHT,
  },
  [`& .${classes.title}`]: {
    color: theme.palette.colors.trueBlack,
  },
  [`& .${classes.text}`]: {
    color: theme.palette.colors.gray70,
    whiteSpace: 'pre-line',
  },
}))

export interface ResetFailedPanelProps {
  open: boolean
  handleClose: () => void
  message: string
  onRetry?: () => void
}

export const ResetFailedPanel: React.FC<ResetFailedPanelProps> = ({ open, handleClose, message, onRetry }) => (
  <Modal open={open} handleClose={handleClose} isCloseDisabled={true} withoutHeader>
    <StyledGrid
      container
      justifyContent='center'
      alignItems='center'
      className={classes.root}
      data-testid='resetFailedPanel'
    >
      <Grid
        container
        alignItems='center'
        direction='column'
        className={classes.contentWrapper}
        data-testid='joiningPanelComponent'
      >
        <img className={classes.image} src={GlobeImg} alt='' aria-hidden />
        <Typography variant='h4' className={classes.title}>
          Couldn’t reset the failed link
        </Typography>
        <Typography variant='body2' className={classes.text}>
          {message}
        </Typography>
        <Button variant='contained' onClick={onRetry} data-testid='retry-admission-reset'>
          Try again
        </Button>
      </Grid>
    </StyledGrid>
  </Modal>
)

export default ResetFailedPanel
