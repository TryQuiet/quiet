import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'
import { renderToString } from 'react-dom/server'
import ContentEditable from 'react-contenteditable'
import Immutable from 'immutable'
import Picker from 'emoji-picker-react'
import Fade from '@material-ui/core/Fade'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import WarningIcon from '@material-ui/icons/Warning'
import orange from '@material-ui/core/colors/orange'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'

import MentionPoper from './MentionPoper'
import ChannelInputAction from '../../../../containers/widgets/channels/ChannelInputAction'
import { INPUT_STATE } from '../../../../store/selectors/channel'
import MentionElement from './MentionElement'
import Icon from '../../../ui/Icon'
import emojiGray from '../../../../static/images/emojiGray.svg'
import emojiBlack from '../../../../static/images/emojiBlack.svg'
const styles = theme => {
  return {
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
      fontSize: 14,
      outline: 'none',
      padding: `12px 16px`,
      lineHeight: '24px',
      '&:empty': {
        '&:before': {
          content: 'attr(placeholder)',
          display: 'block',
          color: '#aaa'
        }
      },
      wordBreak: 'break-word'
    },
    textfield: {
      border: `1px solid ${theme.palette.colors.veryLightGray}`,
      borderRadius: 4,
      '&:hover': {
        borderColor: theme.palette.colors.trueBlack
      }
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
    },
    focused: {
      borderColor: theme.palette.colors.trueBlack
    },
    iconButton: {
      marginRight: 0
    },
    highlight: {
      color: theme.palette.colors.lushSky,
      backgroundColor: theme.palette.colors.lushSky12,
      padding: 5,
      borderRadius: 4
    },
    emoji: {
      marginRight: 17,
      marginLeft: 10,
      cursor: 'pointer'
    },
    actions: {
      postion: 'relative'
    },
    picker: {
      position: 'absolute',
      bottom: 60,
      right: 15
    }
  }
}

const inputStateToMessage = {
  [INPUT_STATE.DISABLE]:
    'Sending messages is locked due to insufficient funds - this may be resolved by topping up your account',
  [INPUT_STATE.LOCKED]:
    'All of your funds are locked - please wait for network confirmation or deposit more ZEC to your account',
  [INPUT_STATE.UNREGISTERED]:
    'You can not reply to this message because you are not registered. Please register your nickname ( button next to your balance )'
}

export const ChannelInput = ({
  classes,
  onChange,
  onKeyPress,
  message,
  inputState,
  infoClass,
  setInfoClass,
  channelName,
  messageLimit,
  users,
  setAnchorEl,
  anchorEl,
  mentionsToSelect,
  setMentionsToSelect,
  members
}) => {
  const refSelected = React.useRef()
  const refMentionsToSelect = React.useRef()
  const inputRef = React.createRef()
  const [focused, setFocused] = React.useState(false)
  const [selected, setSelected] = React.useState(0)
  const [emojiHovered, setEmojiHovered] = React.useState(false)
  const [openEmoji, setOpenEmoji] = React.useState(false)

  window.onfocus = () => {
    inputRef.current.el.current.focus()
    setFocused(true)
  }
  React.useEffect(() => {
    inputRef.current.updater.enqueueForceUpdate(inputRef.current)
  }, [channelName])
  // Use reference to bypass memorization
  React.useEffect(() => {
    refSelected.current = selected
  }, [selected])
  React.useEffect(() => {
    refMentionsToSelect.current = mentionsToSelect
  }, [mentionsToSelect])
  const findMentions = text => {
    const splitedMsg = text
      .replace(/ /g, String.fromCharCode(160))
      .split(String.fromCharCode(160))
    const lastMention = splitedMsg[splitedMsg.length - 1].startsWith('@')
    if (lastMention) {
      const possibleMentions = users.filter(
        user =>
          user.nickname.startsWith(
            splitedMsg[splitedMsg.length - 1].substring(1)
          ) && user.nickname !== splitedMsg[splitedMsg.length - 1].substring(1)
      )
      const sortedMentions = Object.values(possibleMentions.toJS()).sort(
        function (a, b) {
          if (a.nickname > b.nickname) {
            return 1
          }
          if (b.nickname > a.nickname) {
            return -1
          }
          return 0
        }
      )
      if (JSON.stringify(mentionsToSelect) !== JSON.stringify(sortedMentions)) {
        setMentionsToSelect(sortedMentions)
        setTimeout(() => {
          setSelected(0)
        }, 0)
      }
      if (possibleMentions.size) {
        splitedMsg[splitedMsg.length - 1] = renderToString(
          <span id={splitedMsg[splitedMsg.length - 1]}>
            {splitedMsg[splitedMsg.length - 1]}
          </span>
        )
      }
    } else {
      if (mentionsToSelect.length !== 0) {
        setMentionsToSelect([])
      }
    }
    for (const key in splitedMsg) {
      const element = splitedMsg[key]
      if (users.find(user => user.nickname === element.substring(1))) {
        splitedMsg[key] = renderToString(
          <span className={classes.highlight}>{element}</span>
        )
        if (key === splitedMsg.length) {
          setMentionsToSelect([])
        }
      }
    }
    return splitedMsg.join(String.fromCharCode(160))
  }

  return (
    <Grid
      container
      className={classNames({
        [classes.root]: true,
        [classes.displayNone]:
          inputState === INPUT_STATE.DISABLE ||
          inputState === INPUT_STATE.LOCKED
      })}
      direction='column'
      justify='center'
    >
      <MentionPoper anchorEl={anchorEl} selected={selected}>
        {mentionsToSelect.map((target, index) => (
          <MentionElement
            key={index}
            name={target.nickname}
            highlight={index === selected}
            onMouseEnter={() => {
              setSelected(index)
            }}
            participant={members.has(target.address)}
            channelName={channelName}
            onClick={e => {
              e.preventDefault()
              const currentMsg = message
                .replace(/ /g, String.fromCharCode(160))
                .split(String.fromCharCode(160))
              currentMsg[currentMsg.length - 1] =
                '@' + refMentionsToSelect.current[refSelected.current].nickname
              currentMsg.push(String.fromCharCode(160))

              onChange(currentMsg.join(String.fromCharCode(160)))
              inputRef.current.el.current.focus()
            }}
          />
        ))}
      </MentionPoper>
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
        <ClickAwayListener
          onClickAway={() => {
            setFocused(false)
          }}
        >
          <Grid
            item
            xs
            container
            className={classNames({
              [classes.textfield]: true,
              [classes.focused]: focused
            })}
            justify='center'
            alignItems='center'
          >
            <Grid item xs>
              <ContentEditable
                ref={inputRef}
                placeholder={`Message ${channelName}`}
                className={classes.input}
                onClick={() => {
                  if (!focused) {
                    setFocused(true)
                  }
                }}
                html={findMentions(message)}
                onChange={e => {
                  if (inputState === INPUT_STATE.AVAILABLE) {
                    if (e.nativeEvent.target.innerText.length > messageLimit) {
                      onChange(
                        e.nativeEvent.target.innerText.substring(
                          0,
                          messageLimit
                        )
                      )
                    } else {
                      onChange(e.nativeEvent.target.innerText)
                    }
                  }
                  setAnchorEl(e.currentTarget.lastElementChild)
                }}
                onKeyDown={e => {
                  if (refMentionsToSelect.current.length) {
                    if (e.nativeEvent.keyCode === 40) {
                      if (
                        parseInt(refSelected.current) + 1 >=
                        refMentionsToSelect.current.length
                      ) {
                        setSelected(0)
                      } else {
                        setSelected(parseInt(refSelected.current) + 1)
                      }
                      e.preventDefault()
                    }
                    if (e.nativeEvent.keyCode === 38) {
                      if (parseInt(refSelected.current) - 1 < 0) {
                        setSelected(refMentionsToSelect.current.length - 1)
                      } else {
                        setSelected(refSelected.current - 1)
                      }
                      e.preventDefault()
                    }
                    if (
                      e.nativeEvent.keyCode === 13 ||
                      e.nativeEvent.keyCode === 9
                    ) {
                      const currentMsg = message
                        .replace(/ /g, String.fromCharCode(160))
                        .split(String.fromCharCode(160))
                      currentMsg[currentMsg.length - 1] =
                        '@' +
                        refMentionsToSelect.current[refSelected.current]
                          .nickname
                      currentMsg.push(String.fromCharCode(160))
                      onChange(currentMsg.join(String.fromCharCode(160)))
                      e.preventDefault()
                    }
                    return
                  }
                  if (
                    inputState === INPUT_STATE.AVAILABLE &&
                    e.nativeEvent.keyCode === 13
                  ) {
                    onKeyPress(e)
                  } else {
                    if (e.nativeEvent.keyCode === 13) {
                      e.preventDefault()
                      if (
                        infoClass !==
                        classNames(classes.backdrop, classes.blinkAnimation)
                      ) {
                        setInfoClass(
                          classNames(classes.backdrop, classes.blinkAnimation)
                        )
                        setTimeout(
                          () => setInfoClass(classNames(classes.backdrop)),
                          1000
                        )
                      }
                    }
                  }
                }}
              />
            </Grid>
            <Grid item className={classes.actions}>
              <Grid container justify='center' alignItems='center'>
                <ChannelInputAction
                  disabled={inputState !== INPUT_STATE.AVAILABLE}
                />
                <Icon
                  className={classes.emoji}
                  src={emojiHovered ? emojiBlack : emojiGray}
                  onClick={() => {
                    setOpenEmoji(true)
                  }}
                  onMouseEnter={() => {
                    setEmojiHovered(true)
                  }}
                  onMouseLeave={() => {
                    setEmojiHovered(false)
                  }}
                />
              </Grid>
              {openEmoji && (
                <ClickAwayListener
                  onClickAway={() => {
                    setOpenEmoji(false)
                  }}
                >
                  <div className={classes.picker}>
                    <Picker
                      onEmojiClick={(e, emoji) => {
                        onChange(message + emoji.emoji)
                        setOpenEmoji(false)
                      }}
                    />
                  </div>
                </ClickAwayListener>
              )}
            </Grid>
          </Grid>
        </ClickAwayListener>
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
  messageLimit: PropTypes.number.isRequired,
  users: PropTypes.instanceOf(Immutable.Map).isRequired,
  setAnchorEl: PropTypes.func.isRequired,
  setMentionsToSelect: PropTypes.func.isRequired,
  anchorEl: PropTypes.object,
  mentionsToSelect: PropTypes.array.isRequired,
  members: PropTypes.instanceOf(Set)
}

ChannelInput.defaultProps = {
  inputState: INPUT_STATE.AVAILABLE,
  members: new Set()
}

export default R.compose(React.memo, withStyles(styles))(ChannelInput)
