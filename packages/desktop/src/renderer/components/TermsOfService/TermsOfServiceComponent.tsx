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
  info: `${PREFIX}info`,
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

  [`& .${classes.info}`]: {
    maxWidth: 520,
    color: theme.palette.text.secondary,
    ...theme.typography.body2,
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
              This community uses a server {qssEndPoint ? `(${qssEndPoint} )` : ''}for messaging without Tor. By joining
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
              Leave Community
            </Button>
          </Grid>
        </StyledGrid>
      </StyledGrid>
    </Modal>
  )
}

export default TermsOfServiceComponent
