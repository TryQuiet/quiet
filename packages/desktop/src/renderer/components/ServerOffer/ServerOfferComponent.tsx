import React, { useCallback, useState } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

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
  content: `${PREFIX}content`,
  titleBar: `${PREFIX}titleBar`,
  heading: `${PREFIX}heading`,
  actionWrap: `${PREFIX}actionWrap`,
  primaryActionButton: `${PREFIX}primaryActionButton`,
  secondaryActionButton: `${PREFIX}secondaryActionButton`,
  title: `${PREFIX}title`,
  info: `${PREFIX}info`,
  icon: `${PREFIX}icon`,
  iconContainer: `${PREFIX}iconContainer`,
  pill: `${PREFIX}pill`,
  mutedAction: `${PREFIX}mutedAction`,
  dividerWrap: `${PREFIX}dividerWrap`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  textAlign: 'center',
  padding: '0px 32px',
  gap: '8px',

  [`& .${classes.content}`]: {
    width: '375px',
    height: '100%',
    padding: '0px 0px 0px 24px',
    gap: '24px',
  },

  // should hold a back button, may not be relevant yet
  [`& .${classes.titleBar}`]: {
    width: '100%',
    height: '60px',
  },

  [`& .${classes.heading}`]: {
    marginTop: '16px',
    marginBottom: '16px',
  },

  [`& .${classes.actionWrap}`]: {
    gap: '16px',
    textAlign: 'center',
    padding: '0 24px',
  },

  [`& .${classes.primaryActionButton}`]: {
    width: '174px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    borderRadius: '16px',
    height: '50px',
    fontWeight: '400',
    padding: '20px 12px',
  },

  [`& .${classes.secondaryActionButton}`]: {
    width: '100px',
    height: '16px',
    fontWeight: '400',
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.background.default,
    },
    color: theme.palette.colors.gray50,
    border: 'none',
    boxShadow: 'none',
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
    marginBottom: 16,
    '& .MuiChip-root': {
      height: 24,
      borderRadius: 8,
      fontWeight: 500,
      fontSize: 14,
      backgroundColor: theme.palette.colors.lightPurple,
      color: theme.palette.colors.primary,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#ECDCF5',
    },
  },

  [`& .${classes.info}`]: {
    maxWidth: 520,
    lineHeight: '20px',
    fontSize: '14px',
    fontWeight: 400,
    color: theme.palette.colors.contrastText,
  },

  [`& .${classes.dividerWrap}`]: {
    // margin: '28px auto 6px auto',
  },
}))

export interface ServerOfferComponentProps {
  open: boolean
  handleClose: (selection: boolean) => void
}

export const ServerOfferComponent: React.FC<ServerOfferComponentProps> = ({ open, handleClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const persistPreference = useCallback(() => {
    try {
      if (dontShowAgain) {
        localStorage.setItem('quiet.serverOffer.dismissed', 'true')
      }
    } catch (e) {
      logger.warn('Unable to persist server-offer preference', e)
    }
  }, [dontShowAgain])

  const onChoose = useCallback(
    (useServer: boolean) => {
      persistPreference()
      handleClose(useServer)
    },
    [persistPreference, handleClose]
  )

  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled testIdPrefix='ServerOffer'>
      <div className={classes.titleBar}></div>
      <StyledGrid container direction='column' alignItems='center' className={classes.content}>
        <Grid item className={classes.iconContainer}>
          <ServerBoxIcon className={classes.icon} />
        </Grid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionWrap}>
          <Grid item className={classes.heading}>
            <Typography className={classes.title}>Want a server?</Typography>

            <div className={classes.pill}>
              <Chip label='It’s free!' />
            </div>

            <Typography variant='body1' className={classes.info}>
              Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on
              iPhones.
            </Typography>
          </Grid>
        </StyledGrid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionWrap}>
          <Grid item>
            <Button
              variant='contained'
              sx={{ textTransform: 'none' }}
              className={classes.primaryActionButton}
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
              className={classes.secondaryActionButton}
              onClick={() => onChoose(false)}
              data-testid='ServerOffer-NotNow'
            >
              Not now
            </Button>
          </Grid>
        </StyledGrid>
        <Grid item className={classes.dividerWrap} sx={{ width: '100%' }}>
          <Divider />
        </Grid>

        <Grid item>
          <FormControlLabel
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
