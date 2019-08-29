import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'

import TextField from '@material-ui/core/TextField'
import Fade from '@material-ui/core/Fade'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import WarningIcon from '@material-ui/icons/Warning'

import orange from '@material-ui/core/colors/orange'

import ChannelInputAction from '../../../../containers/widgets/channels/ChannelInputAction'
import { INPUT_STATE } from '../../../../store/selectors/channel'
const styles = theme => ({
  root: {
    background: '#fff',
    borderTop: 'solid #cbcbcb 2px',
    height: '100%',
    width: '100%'
  },
  '@keyframes blinker': {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  input: {
    fontSize: 15
  },
  inputsDiv: {
    padding: `18px ${2 * theme.spacing.unit}px`,
    width: '100%',
    margin: '0px'
  },
  multiline: {
    padding: `10px ${2 * theme.spacing.unit}px 9px`
  },
  warningIcon: {
    color: orange[500]
  },
  blinkAnimation: {
    animationName: 'blinker',
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 1
  },
  backdrop: {
    height: 'auto',
    padding: `${theme.spacing.unit}px`,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    WebkitTapHighlightColor: 'transparent',
    pointerEvents: 'none',
    touchAction: 'none'
  }
})

const inputStateToMessage = {
  [INPUT_STATE.DISABLE]:
    'Sending messages is locked due to insufficient funds - this may be resolved by topping up your account',
  [INPUT_STATE.LOCKED]:
    'All of your funds are locked - please wait for network confirmation or deposit more ZEC to your account'
}
// TODO: refactor with formik
export const ChannelInput = ({
  classes,
  onChange,
  onKeyPress,
  message,
  inputState,
  infoClass,
  setInfoClass
}) => {
  return (
    <Grid container className={classes.root} direction='column' justify='center'>
      {inputState !== INPUT_STATE.AVAILABLE && (
        <Fade in>
          <Grid
            container
            direction='column'
            justify='center'
            alignItems='center'
            className={infoClass || classes.backdrop}
          >
            <WarningIcon className={classes.warningIcon} />
            <Typography variant='caption' align='center'>
              {inputStateToMessage[inputState]}
            </Typography>
          </Grid>
        </Fade>
      )}
      <Grid
        container
        direction='row'
        alignItems='center'
        justify='center'
        spacing={16}
        className={classes.inputsDiv}
      >
        <Grid item xs>
          <TextField
            id='channel-input'
            multiline
            fullWidth
            margin='none'
            rowsMax='15'
            variant='outlined'
            placeholder='Send a message'
            value={message}
            onKeyPress={e => {
              if (inputState === INPUT_STATE.AVAILABLE) {
                onKeyPress(e)
              } else {
                if (e.nativeEvent.keyCode === 13) {
                  e.preventDefault()
                  if (infoClass !== classNames(classes.backdrop, classes.blinkAnimation)) {
                    setInfoClass(classNames(classes.backdrop, classes.blinkAnimation))
                    setTimeout(() => setInfoClass(classNames(classes.backdrop)), 1000)
                  }
                }
              }
            }}
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
          <ChannelInputAction disabled={inputState !== INPUT_STATE.AVAILABLE} />
        </Grid>
      </Grid>
    </Grid>
  )
}

ChannelInput.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  inputState: PropTypes.number.isRequired,
  infoClass: PropTypes.string,
  setInfoClass: PropTypes.func,
  message: PropTypes.string
}

ChannelInput.defaultProps = {
  inputState: INPUT_STATE.AVAILABLE
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInput)
