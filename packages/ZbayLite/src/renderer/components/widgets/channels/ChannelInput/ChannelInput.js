import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import TextField from '@material-ui/core/TextField'
import Fade from '@material-ui/core/Fade'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import WarningIcon from '@material-ui/icons/Warning'

import orange from '@material-ui/core/colors/orange'

import ChannelInputAction from '../../../../containers/widgets/channels/ChannelInputAction'

const styles = theme => ({
  root: {
    background: '#fff',
    borderTop: 'solid #cbcbcb 2px',
    padding: `18px ${2 * theme.spacing.unit}px`,
    position: 'relative',
    height: '100%'
  },
  input: {
    fontSize: 15
  },
  multiline: {
    padding: `10px ${2 * theme.spacing.unit}px 9px`
  },
  warningIcon: {
    color: orange[500]
  },
  backdrop: {
    zIndex: 100,
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    WebkitTapHighlightColor: 'transparent',
    pointerEvents: 'none',
    touchAction: 'none'
  }
})

// TODO: refactor with formik
export const ChannelInput = ({ classes, onChange, onKeyPress, message, disabled }) => (
  <Grid
    container
    className={classes.root}
    direction='column'
    justify='center'
  >
    <Fade in={disabled}>
      <Grid container direction='column' justify='center' alignItems='center' className={classes.backdrop}>
        <WarningIcon className={classes.warningIcon} />
        <Typography variant='caption' align='center'>
          Sending messages is locked due to insufficient funds - this may be resolved by topping up your account or waiting for the funds locked by the network.
        </Typography>
      </Grid>
    </Fade>
    <Grid container direction='row' alignItems='center' justify='center' spacing={16}>
      <Grid item xs>
        <TextField
          id='channel-input'
          multiline
          fullWidth
          margin='none'
          disabled={disabled}
          rowsMax='15'
          variant='outlined'
          placeholder='Send a message'
          value={message}
          onKeyPress={onKeyPress}
          onChange={onChange}
          inputProps={{
            className: classes.input
          }}
          InputProps={{
            classes: {
              multiline: classes.multiline
            }
          }}
        />
      </Grid>
      <Grid item>
        <ChannelInputAction disabled={disabled} />
      </Grid>
    </Grid>
  </Grid>
)

ChannelInput.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  message: PropTypes.string
}

ChannelInput.defaultProps = {
  disabled: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInput)
