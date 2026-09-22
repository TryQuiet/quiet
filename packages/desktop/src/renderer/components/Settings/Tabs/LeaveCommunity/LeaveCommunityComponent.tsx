import React, { FC, useRef, useState } from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import ActionProgress from '../../../ui/ActionProgress/ActionProgress'

const PREFIX = 'LeaveCommunity'

const classes = {
  root: `${PREFIX}root`,
  titleContainer: `${PREFIX}titleContainer`,
  descContainer: `${PREFIX}descContainer`,
  iconContainer: `${PREFIX}iconContainer`,
  buttonContainer: `${PREFIX}buttonContainer`,
  button: `${PREFIX}button`,
  secondaryButtonContainer: `${PREFIX}secondaryButtonContainer`,
  secondaryButton: `${PREFIX}secondaryButton`,
  progressContainer: `${PREFIX}progressContainer`,
  error: `${PREFIX}error`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {},

  [`& .${classes.titleContainer}`]: {
    marginTop: 16,
  },

  [`& .${classes.descContainer}`]: {
    marginTop: 16,
    width: '100%',
    maxWidth: 600,
  },

  [`& .${classes.iconContainer}`]: {
    marginTop: 0,
  },

  [`& .${classes.buttonContainer}`]: {
    marginTop: 8,
  },

  [`& .${classes.button}`]: {
    width: 190,
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple,
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.gray,
    },
  },

  [`& .${classes.secondaryButtonContainer}`]: {
    marginTop: 16,
    marginBottom: 1,
  },

  [`& .${classes.secondaryButton}`]: {
    width: 160,
    height: 40,
    color: theme.palette.colors.darkGray,
    backgroundColor: theme.palette.colors.white,
    padding: theme.spacing(2),
    '&:hover': {
      boxShadow: 'none',
      cursor: 'pointer',
      backgroundColor: theme.palette.colors.white,
    },
  },

  // The progress takes the action area's place, so the modal keeps its height.
  [`& .${classes.progressContainer}`]: {
    marginTop: 24,
    marginBottom: 1,
  },

  [`& .${classes.error}`]: {
    marginTop: 16,
    color: theme.palette.error.main,
  },
}))

/**
 * Leaving a community. The confirmation is the library's `Remove community` /
 * `Type=Leave` (Quiet Design Library 0j7Nna9zWmfOSNmRmQK1Uh, 5548:33995): a
 * warning icon, the title, the warning, then a primary `Go back` (5548:33987)
 * with `Leave community` under it as grey text (5548:33988) - so the quiet
 * grey is the design, not a disabled state.
 *
 * The design draws no leaving state, so the in-progress one is the library's
 * progress pattern (ui/ActionProgress) with the app's own wording, in place of
 * those two actions. The button used to stay put, disabled, with the status as
 * its label, which made a designedly-grey action read as a dead one.
 */
export const LEAVING_STATUS = 'Leaving community…'

export interface LeaveCommunityProps {
  communityName: string
  leaveCommunity: () => Promise<void> | void
  open: boolean
  handleClose: () => void
}

export const LeaveCommunityComponent: FC<LeaveCommunityProps> = ({ leaveCommunity, handleClose }) => {
  const [leaving, setLeaving] = useState(false)
  const [failed, setFailed] = useState(false)
  // The button is gone while leaving, so a second click needs a detached node;
  // the ref makes that a no-op anyway rather than a second clearCommunity().
  const inFlight = useRef(false)
  const handleLeave = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setLeaving(true)
    setFailed(false)
    try {
      await leaveCommunity()
    } catch {
      setFailed(true)
    } finally {
      inFlight.current = false
      setLeaving(false)
    }
  }

  return (
    <StyledGrid container justifyContent='center'>
      <Grid container item className={classes.titleContainer} xs={12} direction='row' justifyContent='center'>
        <Typography variant={'h3'}>Leave community?</Typography>
      </Grid>
      <Grid container item className={classes.descContainer} xs={12} direction='row' justifyContent='center'>
        <Typography align={'center'} variant='body2'>
          You will no longer have access to this community. This can't be undone.
        </Typography>
      </Grid>
      {leaving ? (
        // Leaving takes the action area's place: the title and the warning stay,
        // the buttons go. Nothing here is clickable, so nothing is greyed out.
        <Grid container item className={classes.progressContainer} xs={12} direction='row' justifyContent='center'>
          <ActionProgress status={LEAVING_STATUS} data-testid={'leave-community-progress'} />
        </Grid>
      ) : (
        <>
          <Grid
            container
            item
            className={classes.secondaryButtonContainer}
            xs={12}
            direction='row'
            justifyContent='center'
          >
            <Button variant='contained' onClick={handleClose} size='small' className={classes.button}>
              Go back
            </Button>
          </Grid>
          <Grid item xs={'auto'} className={classes.buttonContainer}>
            <Button
              variant='contained'
              onClick={handleLeave}
              size='small'
              fullWidth
              className={classes.secondaryButton}
              data-testid={'leave-community-button'}
            >
              Leave community
            </Button>
          </Grid>
        </>
      )}
      {failed && (
        <Grid container item xs={12} direction='row' justifyContent='center'>
          <Typography variant='body2' role='alert' className={classes.error}>
            Unable to leave the community. Please try again.
          </Typography>
        </Grid>
      )}
    </StyledGrid>
  )
}

export default LeaveCommunityComponent
