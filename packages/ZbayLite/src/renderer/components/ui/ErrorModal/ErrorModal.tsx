import React from 'react'

import fetch from 'isomorphic-fetch'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'

import { makeStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import Icon from '../Icon/Icon'
import Modal from '../Modal/Modal'
import LoadingButton from '../LoadingButton/LoadingButton'

import { LOG_ENDPOINT } from '../../../../shared/static'

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

const handleSend = async ({ title, message }) => {
  await fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      message
    })
  })
}

interface ErrorModalProps {
  open: boolean
  message: string
  traceback: string
  handleExit: () => void
  successSnackbar: () => void
  errorSnackbar: () => void
  restartApp: () => void
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  open = false,
  message,
  traceback,
  handleExit,
  successSnackbar,
  errorSnackbar,
  restartApp
}) => {
  const classes = useStyles({})

  const [send, setSend] = React.useState(false)

  return (
    <Modal open={open} handleClose={handleExit} title='Error'>
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
              You can send us this error traceback to help us improve. Before sending make sure it
              doesn't contain any private data.
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
            {!send && (
              <LoadingButton
                text='Send & restart'
                classes={{ button: classes.button }}
                onClick={async () => {
                  try {
                    await handleSend({ title: message, message: traceback })
                    successSnackbar()
                    setSend(true)
                    restartApp()
                  } catch (err) {
                    errorSnackbar()
                  }
                }}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default ErrorModal
