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
  contentWrap: `${PREFIX}contentWrap`,
  actionsWrap: `${PREFIX}actions`,
  textWrap: `${PREFIX}text`,
  dividerWrap: `${PREFIX}dividerWrap`,
  info: `${PREFIX}info`,
  icon: `${PREFIX}icon`,
  iconContainer: `${PREFIX}iconContainer`,
  pill: `${PREFIX}pill`,
  mutedAction: `${PREFIX}mutedAction`,
  useServerButton: `${PREFIX}useServerButton`,
  notNowButton: `${PREFIX}notNowButton`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  textAlign: 'center',
  justifyContent: 'center',

  [`&.${classes.contentWrap}`]: {
    width: '100%',
    height: '100%',
    gap: theme.spacing(3),
    padding: theme.spacing(0, 4),
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.actionsWrap}`]: {
    gap: theme.spacing(2),
  },

  [`& .${classes.textWrap}`]: {
    padding: theme.spacing(0, 3),
    gap: theme.spacing(2),
  },

  [`& .${classes.dividerWrap}`]: {
    width: '100%',
  },

  [`& .${classes.useServerButton}`]: {
    height: '50px',
    padding: theme.spacing(1.5, 2.5),
    width: 'auto',
    ...theme.typography.body1,
  },

  [`& .${classes.notNowButton}`]: {
    minWidth: '62px',
    padding: 0,
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
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

  [`& .${classes.pill}`]: {
    ...theme.typography.subtitle2,

    '& .MuiChip-root': {
      height: 24,
      borderRadius: 4,
      backgroundColor: theme.palette.colors.lightPurple,
      color: theme.palette.primary.main,
      border: `1px solid ${theme.palette.colors.border03}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '& .MuiChip-label': {
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '20px',
      padding: theme.spacing(0.5, 1),
    },
  },

  [`& .${classes.info}`]: {
    maxWidth: 520,
    color: theme.palette.text.secondary,
    ...theme.typography.body2,
  },
  [`& .${classes.mutedAction}`]: {
    '& .MuiFormControlLabel-label': {
      ...theme.typography.body2,
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
            <Typography variant='h3'>Want a server?</Typography>
          </Grid>
          <Grid item className={classes.pill}>
            <Chip label='It’s free!' />
          </Grid>
          <Grid item>
            <Typography className={classes.info}>
              Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on
              iPhones.
            </Typography>
          </Grid>
        </StyledGrid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionsWrap}>
          <Grid item>
            <Button
              variant='contained'
              className={classes.useServerButton}
              onClick={() => onChoose(true)}
              data-testid='ServerOffer-UseQuietServer'
              size='large'
            >
              Use Quiet’s server
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='text'
              className={classes.notNowButton}
              onClick={() => onChoose(false)}
              data-testid='ServerOffer-NotNow'
              size='small'
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
