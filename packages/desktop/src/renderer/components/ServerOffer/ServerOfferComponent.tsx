import React, { useCallback, useState } from 'react'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

import Modal from '../ui/Modal/Modal'
import Button from '@mui/material/Button'
import { createLogger } from '../../logger'

import ServerBoxIcon from '../ui/assets/icons/ServerBoxIcon'

const logger = createLogger('ServerOffer:component')

const PREFIX = 'ServerOfferComponent-'
const classes = {
  titleBar: `${PREFIX}titleBar`,
  contentWrap: `${PREFIX}contentWrap`,
  actionsWrap: `${PREFIX}actions`,
  textWrap: `${PREFIX}text`,
  dividerWrap: `${PREFIX}dividerWrap`,
  heading: `${PREFIX}heading`,
  useServerButton: `${PREFIX}useServerButton`,
  notNowButton: `${PREFIX}notNowButton`,
  title: `${PREFIX}title`,
  info: `${PREFIX}info`,
  icon: `${PREFIX}icon`,
  iconContainer: `${PREFIX}iconContainer`,
  pill: `${PREFIX}pill`,
  mutedAction: `${PREFIX}mutedAction`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  textAlign: 'center',
  justifyContent: 'center',

  [`&.${classes.contentWrap}`]: {
    width: '100%',
    height: '100%',
    gap: '24px',
    padding: '0px 32px',
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.actionsWrap}`]: {
    gap: '16px',
  },

  [`& .${classes.textWrap}`]: {
    padding: '0px 24px',
    gap: '16px',
  },

  [`& .${classes.dividerWrap}`]: {
    width: '100%',
  },

  [`& .${classes.useServerButton}`]: {
    height: '50px',
    borderRadius: '16px',
    padding: '12px 20px',
    width: 'auto',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '26px',
    textAlign: 'center',
    textTransform: 'none',
  },

  [`& .${classes.notNowButton}`]: {
    height: '16px',
    minWidth: '62px',
    padding: 0,
    borderRadius: '4px',

    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '16px',
    letterSpacing: 0,
    textTransform: 'none',

    backgroundColor: 'transparent',
    color: theme.palette.colors.gray50,
    border: 'none',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
      boxShadow: 'none',
    },
  },

  [`& .${classes.iconContainer}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
  },
  [`& .${classes.icon}`]: {
    width: 48,
    height: 51,
  },

  [`& .${classes.title}`]: {
    fontWeight: 500,
    fontSize: '28px',
    lineHeight: '34px',
  },

  [`& .${classes.pill}`]: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,

    '& .MuiChip-root': {
      height: 24,
      borderRadius: 4,
      backgroundColor: theme.palette.colors.lightPurple,
      color: theme.palette.colors.primary,
      border: '1px solid #ECDCF5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '& .MuiChip-label': {
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '20px',
      padding: '2px 8px',
    },
  },

  [`& .${classes.info}`]: {
    maxWidth: 520,
    lineHeight: '20px',
    fontSize: '14px',
    fontWeight: 400,
    color: theme.palette.colors.contrastText,
  },
  [`& .${classes.mutedAction}`]: {
    '& .MuiFormControlLabel-label': {
      fontSize: '14px',
    },
  },
}))

export interface ServerOfferComponentProps {
  open: boolean
  handleClose: (selection: boolean) => void
}

export const ServerOfferComponent: React.FC<ServerOfferComponentProps> = ({ open, handleClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const persistPreference = useCallback(() => {}, [dontShowAgain])

  const onChoose = useCallback(
    (useServer: boolean) => {
      persistPreference()
      handleClose(useServer)
    },
    [persistPreference, handleClose]
  )

  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true} testIdPrefix='ServerOffer'>
      <StyledGrid container direction='column' alignItems='center' className={classes.contentWrap}>
        <Grid item className={classes.iconContainer}>
          <ServerBoxIcon className={classes.icon} />
        </Grid>
        <StyledGrid container direction='column' alignItems='center' className={classes.textWrap}>
          <Grid item>
            <Typography className={classes.title}>Want a server?</Typography>
          </Grid>
          <Grid item className={classes.pill}>
            <Chip label='It’s free!' />
          </Grid>
          <Grid item>
            <Typography variant='body1' className={classes.info}>
              Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on
              iPhones.
            </Typography>
          </Grid>
        </StyledGrid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionsWrap}>
          <Grid item>
            <Button
              variant='contained'
              sx={{ textTransform: 'none' }}
              className={classes.useServerButton}
              onClick={() => onChoose(true)}
              data-testid='ServerOffer-UseQuietServer'
            >
              Use Quiet’s server
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              sx={{ textTransform: 'none' }}
              className={classes.notNowButton}
              onClick={() => onChoose(false)}
              data-testid='ServerOffer-NotNow'
            >
              Not now
            </Button>
          </Grid>
        </StyledGrid>
        <Grid item className={classes.dividerWrap}>
          <Divider />
        </Grid>

        <Grid item>
          <FormControlLabel
            className={classes.mutedAction}
            control={
              <Checkbox color='primary' checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} />
            }
            label='Don’t show this again'
          />
        </Grid>
      </StyledGrid>
    </Modal>
  )
}
