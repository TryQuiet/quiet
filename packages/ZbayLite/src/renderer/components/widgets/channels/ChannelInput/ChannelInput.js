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
import { InputAdornment } from '@material-ui/core'
import orange from '@material-ui/core/colors/orange'

import ChannelInputAction from '../../../../containers/widgets/channels/ChannelInputAction'
import { INPUT_STATE } from '../../../../store/selectors/channel'
const styles = theme => ({
  root: {
    background: '#fff',
    height: '100%',
    width: '100%'
  },
  '@keyframes blinker': {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  input: {
    fontSize: 14
  },
  textfield: {
    '&$cssFocused $notchedOutline': {
      borderStyle: 'solid',
      borderWidth: '1px'
    }
  },

  cssFocused: {},

  notchedOutline: {
    borderColor: theme.palette.colors.inputGray
  },
  multiline: {
    padding: '12px 16px'
  },
  inputsDiv: {
    paddingLeft: `20px`,
    paddingRight: `20px`,
    marginBottom: `20px`,
    width: '100%',
    margin: '0px'
  },
  warningIcon: {
    color: orange[500]
  },
  blinkAnimation: {
    animationName: '$blinker',
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 1
  },
  backdrop: {
    height: 'auto',
    padding: `${theme.spacing(1)}px`,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    WebkitTapHighlightColor: 'transparent',
    pointerEvents: 'none',
    touchAction: 'none'
  },
  displayNone: {
    display: 'none'
  }
})

const inputStateToMessage = {
  [INPUT_STATE.DISABLE]:
    'Sending messages is locked due to insufficient funds - this may be resolved by topping up your account',
  [INPUT_STATE.LOCKED]:
    'All of your funds are locked - please wait for network confirmation or deposit more ZEC to your account',
  [INPUT_STATE.UNREGISTERED]:
    'You can not reply to this message because you are not registered. Please register your nickname ( button next to your balance )'
}
// TODO: refactor with formik

export const ChannelInput = ({
  classes,
  onChange,
  onKeyPress,
  message,
  inputState,
  infoClass,
  setInfoClass,
  channelName,
  messageLimit
}) => {
  const inputRef = React.createRef()
  window.onfocus = () => {
    inputRef.current.focus()
  }
  return (
    <Grid
      container
      className={classNames({
        [classes.root]: true,
        [classes.displayNone]: inputState === INPUT_STATE.DISABLE || inputState === INPUT_STATE.LOCKED
      })}
      direction='column'
      justify='center'
    >
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
        spacing={0}
        className={classes.inputsDiv}
      >
        <Grid item xs>
          <TextField
            inputRef={inputRef}
            id='channel-input'
            fullWidth
            autoFocus
            margin='none'
            variant='outlined'
            placeholder={`Message ${channelName}`}
            multiline
            rowsMax={5}
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
              className: classes.input,
              maxLength: messageLimit
            }}
            InputProps={{
              classes: {
                root: classes.textfield,
                focused: classes.cssFocused,
                notchedOutline: classes.notchedOutline,
                multiline: classes.multiline
              },
              endAdornment: (
                <InputAdornment position='end'>
                  <ChannelInputAction disabled={inputState !== INPUT_STATE.AVAILABLE} />
                </InputAdornment>
              )
            }}
          />
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
  message: PropTypes.string,
  channelName: PropTypes.string.isRequired,
  messageLimit: PropTypes.number.isRequired

}

ChannelInput.defaultProps = {
  inputState: INPUT_STATE.AVAILABLE
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInput)
