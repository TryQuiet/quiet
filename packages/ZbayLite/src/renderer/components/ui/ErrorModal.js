import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import { withStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import Icon from './Icon'
import exclamationMark from '../../static/images/exclamationMark.svg'
import Modal from './Modal'
import LoadingButton from './LoadingButton'

const styles = theme => ({
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
})

export const ErrorModal = ({ classes, open, message, traceback, handleExit }) => (
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
          <LoadingButton classes={{ button: classes.button }} text='Send to Zbay' />
        </Grid>
      </Grid>
    </Grid>
  </Modal>
)

ErrorModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  traceback: PropTypes.string.isRequired,
  handleExit: PropTypes.func.isRequired
}

ErrorModal.defaultProps = {
  open: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ErrorModal)
