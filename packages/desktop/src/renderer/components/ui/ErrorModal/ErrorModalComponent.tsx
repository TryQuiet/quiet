import React from 'react'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'

import { makeStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import Icon from '../Icon/Icon'
import Modal from '../Modal/Modal'
import LoadingButton from '../LoadingButton/LoadingButton'

import exclamationMark from '../../../static/images/exclamationMark.svg'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  },
  icon: {
    fontSize: '10rem',
    color: red[500],
    width: 80,
    height: 70
  },
  stackTrace: {
    fontSize: '14px',
    wordBreak: 'break-all'
  },
  message: {
    wordBreak: 'break-all',
    marginTop: 20,
    fontWeight: 500
  },
  info: {
    textAlign: 'center'
  },
  textfield: {},
  cssDisabled: {
    backgroundColor: theme.palette.colors.inputGray,
    color: theme.palette.colors.red
  },
  button: {
    textTransform: 'none',
    width: 150,
    height: 60
  }
}))

interface ErrorModalProps {
  open: boolean
  message: string
  traceback: string
  handleClose: () => void
  restartApp?: () => void
}

export const ErrorModalComponent: React.FC<ErrorModalProps> = ({
  open,
  message,
  traceback,
  handleClose,
  restartApp
}) => {
  const classes = useStyles({})

  return (
    <Modal open={open} handleClose={handleClose} title='Error'>
      <Grid container justify='flex-start' spacing={3} direction='column' className={classes.root}>
        <Grid item container direction='column' alignItems='center'>
          <Icon className={classes.icon} src={exclamationMark} />
          <Typography variant='h3' className={classes.message}>
            {message}
          </Typography>
        </Grid>
        <Grid item container spacing={2} direction='column'>
          <Grid item>
            <Typography variant='body2' className={classes.info}>
              This error traceback was sent to centralized server.
            </Typography>
          </Grid>
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
          <Grid item container justify='center' alignItems='center'>
            <LoadingButton
              text='Restart'
              classes={{ button: classes.button }}
              onClick={restartApp}
            />
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default ErrorModalComponent
