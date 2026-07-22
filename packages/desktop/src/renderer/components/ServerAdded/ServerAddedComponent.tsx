import React from 'react'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import Modal from '../ui/Modal/Modal'
import Button from '@mui/material/Button'

import ServerBoxIcon from '../ui/assets/icons/ServerBoxIcon'
import WarningIcon from '../../static/images/exclamationMark.svg'

const PREFIX = 'ServerAddedComponent-'
const classes = {
  contentWrap: `${PREFIX}contentWrap`,
  actionsWrap: `${PREFIX}actions`,
  textWrap: `${PREFIX}text`,
  dividerWrap: `${PREFIX}dividerWrap`,
  info: `${PREFIX}info`,
  icon: `${PREFIX}icon`,
  warningIcon: `${PREFIX}warningIcon`,
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
  [`& .${classes.warningIcon}`]: {
    width: 58,
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

const LOCAL_QSS_HOST_PATTERN =
  /^(?:(?:.+\.)?localhost|(?:.+\.)?local|host\.docker\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|::1|f[cd][0-9a-f]{2}:.*|fe[89ab][0-9a-f]:.*)$/i

const normalizeServerHost = (serverHost: string | undefined): string | undefined => {
  if (!serverHost) return undefined

  try {
    const endpoint = /^[a-z][a-z\d+.-]*:\/\//i.test(serverHost) ? serverHost : `ws://${serverHost}`
    const hostname = new URL(endpoint).hostname.toLowerCase().replace(/^\[|\]$/g, '')
    return LOCAL_QSS_HOST_PATTERN.test(hostname) ? 'localhost' : hostname
  } catch {
    return serverHost.toLowerCase()
  }
}

export const isConfiguredQuietServer = (serverHost: string, qssEndpoint: string | undefined): boolean => {
  const normalizedQssHost = normalizeServerHost(qssEndpoint)
  return normalizedQssHost != null && normalizeServerHost(serverHost) === normalizedQssHost
}

export interface ServerAddedComponentProps {
  open: boolean
  onChoose: (useServer: boolean) => void
  serverHosts: string[]
}

export const ServerAddedComponent: React.FC<ServerAddedComponentProps> = ({ open, onChoose, serverHosts }) => {
  const isQuietServer = serverHosts.length === 1 && isConfiguredQuietServer(serverHosts[0], process.env.QSS_ENDPOINT)
  const serverList = serverHosts.join(', ')
  const serverDescription = isQuietServer
    ? `This community's admins have added a server (${serverList}) for more speed and reliability`
    : serverHosts.length > 1
      ? `This community's admins have added servers (${serverList}). At least one of these servers is not owned or operated by Quiet`
      : `This community's admins have added a server (${serverList}). This server is not owned or operated by Quiet`

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
          {isQuietServer ? (
            <ServerBoxIcon className={classes.icon} data-testid='ServerAdded-QuietServerIcon' />
          ) : (
            <img
              className={classes.warningIcon}
              src={WarningIcon}
              alt='Warning'
              data-testid='ServerAdded-NonQuietServerWarningIcon'
            />
          )}
        </Grid>
        <StyledGrid container direction='column' alignItems='center' className={classes.textWrap}>
          <Grid item>
            <Typography variant='h3' data-testid='ServerAdded-Title'>
              {isQuietServer
                ? 'This community is hosted on Quiet’s server'
                : 'This community uses a server not owned by Quiet'}
            </Typography>
          </Grid>
          <Grid item>
            <Typography className={classes.info} data-testid='ServerAdded-Message'>
              {serverDescription}. Quiet will connect to the server without Tor, so this comes at the cost of Tor's
              anonymity protection. Would you like to use the server or leave the community?
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
