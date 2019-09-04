import React from 'react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import FileCopyIcon from '@material-ui/icons/FileCopy'
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline'

import Modal from './Modal'

const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  icon: {
    fontSize: '10rem',
    color: red[500]
  },
  stackTrace: {
    fontSize: '0.71rem'
  },
  copyButton: {
    marginBottom: 4
  },
  message: {
    wordBreak: 'break-all'
  }
})

export const ErrorModal = ({
  classes,
  open,
  message,
  traceback,
  handleExit,
  handleCopy
}) => (
  <Modal
    open={open}
    handleClose={handleExit}
    title='Error'
  >
    <Grid
      container
      justify='flex-start'
      spacing={3}
      direction='column'
      className={classes.root}
    >
      <Grid item container direction='column' alignItems='center'>
        <ErrorOutlineIcon className={classes.icon} />
        <Typography className={classes.message}>
          { message }
        </Typography>
      </Grid>
      <Grid item container spacing={2} direction='column'>
        <Grid item container direction='row' alignItems='center'>
          <Typography variant='h5' display='inline' >
            Traceback
          </Typography>
          <CopyToClipboard text={traceback} onCopy={handleCopy}>
            <IconButton className={classes.copyButton}>
              <FileCopyIcon />
            </IconButton>
          </CopyToClipboard>
        </Grid>
        <Grid item>
          <Typography>
            Before sending error traceback to our devs please make sure it doesn't contain any private data.
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
                multiline: classes.stackTrace
              }
            }}
          />
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
  handleExit: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

ErrorModal.defaultProps = {
  open: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ErrorModal)
