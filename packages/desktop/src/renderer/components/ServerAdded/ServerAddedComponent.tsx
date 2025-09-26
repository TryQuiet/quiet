import React from 'react'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import Modal from '../ui/Modal/Modal'
import Button from '@mui/material/Button'
import { createLogger } from '../../logger'

import ServerBoxIcon from '../ui/assets/icons/ServerBoxIcon'

const logger = createLogger('ServerAdded:component')

const PREFIX = 'ServerAddedComponent-'
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
    flex: 1,
    display: 'flex',
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

export interface ServerAddedComponentProps {
  open: boolean
  onChoose: (useServer: boolean) => void
  serverHosts: string[]
}

export const ServerAddedComponent: React.FC<ServerAddedComponentProps> = ({ open, onChoose, serverHosts }) => {
  const isQuietServer = serverHosts.length === 1 && serverHosts[0] === process.env.QSS_ENDPOINT

  return (
    <Modal
      open={open}
      handleClose={() => onChoose(false)}
      isCloseDisabled={true}
      withoutHeader
      testIdPrefix='ServerAdded'
    >
      <StyledGrid container direction='column' alignItems='center' className={classes.contentWrap}>
        <Grid item className={classes.iconContainer}>
          <ServerBoxIcon className={classes.icon} />
        </Grid>
        <StyledGrid container direction='column' alignItems='center' className={classes.textWrap}>
          <Grid item>
            <Typography variant='h3'>
              {isQuietServer ? 'This community is hosted on Quiet’s server' : 'This community is hosted on a server'}
            </Typography>
          </Grid>
          <Grid item>
            <Typography className={classes.info}>
              This community's admins have added a server (
              {isQuietServer ? serverHosts[0] : serverHosts.length > 1 ? serverHosts.join(', ') : serverHosts[0]})
              {isQuietServer ? ' for more speed and reliability' : ''}. Quiet will connect to the server without Tor, so
              this comes at the cost of Tor's anonymity protection. Would you like to use the server or leave the
              community?
            </Typography>
          </Grid>
        </StyledGrid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionsWrap}>
          <Grid item>
            <Button
              variant='contained'
              className={classes.useServerButton}
              onClick={() => onChoose(true)}
              data-testid='ServerAdded-UseQuietServer'
              size='large'
            >
              Continue With Server
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='text'
              className={classes.notNowButton}
              onClick={() => onChoose(false)}
              data-testid='ServerAdded-Abort'
              size='small'
            >
              Leave Community
            </Button>
          </Grid>
        </StyledGrid>
      </StyledGrid>
    </Modal>
  )
}
