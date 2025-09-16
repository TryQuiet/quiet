import React from 'react'
import { shell } from 'electron'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import Modal from '../ui/Modal/Modal'
import Button from '@mui/material/Button'
import { createLogger } from '../../logger'

const logger = createLogger('TermOfService:component')

const PREFIX = 'TermOfServiceComponent-'
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
  rejectButton: `${PREFIX}rejectButton`,
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

  [`& .${classes.rejectButton}`]: {
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

export interface TermsOfServiceComponentProps {
  open: boolean
  handleClose: () => void
  onChoose: (useServer: boolean) => void
  openURL: () => void
  qssEndPoint?: string
}

export const TermsOfServiceComponent: React.FC<TermsOfServiceComponentProps> = ({
  open,
  handleClose,
  onChoose,
  openURL,
  qssEndPoint,
}) => {
  return (
    <Modal open={open} handleClose={handleClose} testIdPrefix='TermOfService' title='Accept Terms of Service'>
      <StyledGrid container direction='column' alignItems='center' className={classes.contentWrap}>
        <StyledGrid container direction='column' alignItems='center' className={classes.textWrap}>
          <Grid item>
            <Typography className={classes.info}>
              This community uses a server ({qssEndPoint ?? 'qss.tryquiet.org'})for messaging without Tor. By joining
              you agree to this{' '}
              <Typography
                component='span'
                style={{ textDecorationLine: 'underline', cursor: 'pointer' }}
                onClick={openURL}
              >
                Privacy Policy and Terms of Use.
              </Typography>
            </Typography>
          </Grid>
        </StyledGrid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionsWrap}>
          <Grid item>
            <Button
              variant='contained'
              className={classes.useServerButton}
              onClick={() => onChoose(true)}
              data-testid='TermOfService-UseQuietServer'
              size='large'
            >
              Agree and Join
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='text'
              className={classes.rejectButton}
              onClick={() => onChoose(false)}
              data-testid='TermOfService-Abort'
              size='small'
            >
              Reject
            </Button>
          </Grid>
        </StyledGrid>
      </StyledGrid>
    </Modal>
  )
}

export default TermsOfServiceComponent
