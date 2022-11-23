import React from 'react'

import { styled } from '@mui/material/styles';

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'

import { makeStyles } from '@mui/material/styles'

import red from '@mui/material/colors/red'

import Icon from '../Icon/Icon'
import Modal from '../Modal/Modal'
import LoadingButton from '../LoadingButton/LoadingButton'

import exclamationMark from '../../../static/images/exclamationMark.svg'

const PREFIX = 'ErrorModalComponent';

const classes = {
  root: `${PREFIX}-root`,
  icon: `${PREFIX}-icon`,
  stackTrace: `${PREFIX}-stackTrace`,
  message: `${PREFIX}-message`,
  info: `${PREFIX}-info`,
  textfield: `${PREFIX}-textfield`,
  cssDisabled: `${PREFIX}-cssDisabled`,
  button: `${PREFIX}-button`
};

const StyledModal = styled(Modal)((
  {
    theme
  }
) => ({
  [`& .${classes.root}`]: {
    padding: theme.spacing(4)
  },

  [`& .${classes.icon}`]: {
    fontSize: '10rem',
    color: red[500],
    width: 80,
    height: 70
  },

  [`& .${classes.stackTrace}`]: {
    fontSize: '14px',
    wordBreak: 'break-all'
  },

  [`& .${classes.message}`]: {
    wordBreak: 'break-all',
    marginTop: 20,
    fontWeight: 500
  },

  [`& .${classes.info}`]: {
    textAlign: 'center'
  },

  [`& .${classes.textfield}`]: {},

  [`& .${classes.cssDisabled}`]: {
    backgroundColor: theme.palette.colors.inputGray,
    color: theme.palette.colors.red
  },

  [`& .${classes.button}`]: {
    textTransform: 'none',
    width: 150,
    height: 60
  }
}));

interface ErrorModalProps {
  open: boolean
  message: string
  traceback: string
  handleClose: () => void
  restartApp: () => void
  testMode: boolean
}

export const ErrorModalComponent: React.FC<ErrorModalProps> = ({
  open,
  message,
  traceback,
  handleClose,
  restartApp,
  testMode
}) => {


  return (
    <StyledModal open={open} handleClose={handleClose} title='Error'>
      <Grid container justifyContent='flex-start' spacing={3} direction='column' className={classes.root}>
        <Grid item container direction='column' alignItems='center'>
          <Icon className={classes.icon} src={exclamationMark} />
          <Typography variant='h3' className={classes.message}>
            {message}
          </Typography>
        </Grid>
        <Grid item container spacing={2} direction='column'>
          {testMode && (
            <Grid item>
              <Typography variant='body2' className={classes.info}>
                This error traceback was sent to centralized server.
              </Typography>
            </Grid>
          )}
          <Grid item>
            <TextField
              id='traceback'
              disabled
              variant='outlined'
              multiline
              fullWidth
              rows={10}
              value={traceback}
              InputProps={{
                classes: {
                  root: classes.textfield,
                  multiline: classes.stackTrace,
                  disabled: classes.cssDisabled
                }
              }}
            />
          </Grid>
          <Grid item container justifyContent='center' alignItems='center'>
            <LoadingButton
              text='Restart'
              classes={{ button: classes.button }}
              onClick={restartApp}
            />
          </Grid>
        </Grid>
      </Grid>
    </StyledModal>
  );
}

export default ErrorModalComponent
