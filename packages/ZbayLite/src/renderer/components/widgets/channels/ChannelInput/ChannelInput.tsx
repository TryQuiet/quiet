import React, { KeyboardEventHandler, useCallback } from 'react'
import classNames from 'classnames'
import { renderToString } from 'react-dom/server'
import ContentEditable from 'react-contenteditable'
import Picker from 'emoji-picker-react'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import orange from '@material-ui/core/colors/orange'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import { shell } from 'electron'

import MentionPoper from './MentionPoper'
import ChannelInputAction from '../../../../containers/widgets/channels/ChannelInputAction'
import ChannelInputInfoMessage from './ChannelInputInfoMessage'
import { INPUT_STATE } from '../../../../store/selectors/channel'
import MentionElement from './MentionElement'
import Icon from '../../../ui/Icon'
import emojiGray from '../../../../static/images/emojiGray.svg'
import emojiBlack from '../../../../static/images/emojiBlack.svg'
import errorIcon from '../../../../static/images/t-error.svg'
import sanitizeHtml from 'sanitize-html'
import { User, UsersStore } from '../../../../store/handlers/users'

const useStyles = makeStyles(theme => ({
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
    padding: '12px 16px',
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
    maxHeight: 300,
    'overflow-y': 'auto',
    borderRadius: 4,
    '&:hover': {
      borderColor: theme.palette.colors.trueBlack
    }
  },
  inputsDiv: {
    paddingLeft: '20px',
    paddingRight: '20px',
    width: '100%',
    margin: '0px'
  },
  disabledBottomMargin: {
    marginBottom: 0
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
  },
  errorIcon: {
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 5
  },
  errorText: {
    color: theme.palette.colors.trueBlack
  },
  errorBox: {
    marginTop: 5
  },
  linkBlue: {
    fontWeight: 'normal',
    fontStyle: 'normal',
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  notAllowed: {
    cursor: 'not-allowed'
  }
}))

interface IChannelInput {
  infoClass: string
  setInfoClass: (arg: string) => void
  id: string
  users: UsersStore
  onChange: (arg: string) => void
  onKeyPress: KeyboardEventHandler<HTMLDivElement>
  message: string
  inputState: INPUT_STATE
  inputPlaceholder: string
  channelName?: string
  anchorEl: HTMLElement
  setAnchorEl: (arg: HTMLElement) => void
  mentionsToSelect: User[]
  setMentionsToSelect: (arg: User[]) => void
  members?: Set<string>
  isMessageTooLong?: boolean
  isDM?: boolean
  sendTypingIndicator?: (arg: boolean) => void
  isContactConnected?: boolean
  isContactTyping?: boolean
  contactUsername?: string
}

export const ChannelInput: React.FC<IChannelInput> = ({
  infoClass,
  setInfoClass,
  id,
  users,
  onChange,
  onKeyPress,
  message: initialMessage,
  inputState,
  inputPlaceholder,
  channelName,
  anchorEl,
  setAnchorEl,
  mentionsToSelect,
  setMentionsToSelect,
  members,
  isMessageTooLong
}) => {
  const classes = useStyles({})

  const messageRef = React.useRef<string>()
  const refSelected = React.useRef<number>()
  const isFirstRenderRef = React.useRef(true)
  const refMentionsToSelect = React.useRef<User[]>()
  const inputRef = React.createRef<ContentEditable & HTMLDivElement & any>() // any for updater.enqueueForceUpdate

  const [focused, setFocused] = React.useState(false)
  const [selected, setSelected] = React.useState(0)
  const [emojiHovered, setEmojiHovered] = React.useState(false)
  const [openEmoji, setOpenEmoji] = React.useState(false)
  const [htmlMessage, setHtmlMessage] = React.useState<string>(initialMessage)
  const [message, setMessage] = React.useState(initialMessage)
  const showInfoMessage = inputState !== INPUT_STATE.AVAILABLE

  window.onfocus = () => {
    inputRef.current.el.current.focus()
    setFocused(true)
  }
  const scrollToBottom = () => {
    const scroll = document.getElementById('messages-scroll').parentElement
    setTimeout(() => {
      scroll.scrollTop = scroll.scrollHeight
    }, 100)
  }
  React.useEffect(() => {
    inputRef.current.updater.enqueueForceUpdate(inputRef.current)
  }, [inputPlaceholder, id])
  // Use reference to bypass memorization
  React.useEffect(() => {
    refSelected.current = selected
  }, [selected])
  React.useEffect(() => {
    refMentionsToSelect.current = mentionsToSelect
  }, [mentionsToSelect])
  React.useEffect(() => {
    if (!message) {
      setHtmlMessage('')
    }
  }, [message])
  React.useEffect(() => {
    setMessage(initialMessage)
    setHtmlMessage(initialMessage)
    if (!isFirstRenderRef.current) {
      return () => {
        onChange(messageRef.current)
      }
    }
    isFirstRenderRef.current = false
  }, [id])
  React.useEffect(() => {
    messageRef.current = message
  }, [message])

  const findMentions = text => {
    const splitedMsg = text.replace(/ /g, String.fromCharCode(160)).split(String.fromCharCode(160))
    const lastMention = splitedMsg[splitedMsg.length - 1].startsWith('@')
    if (lastMention) {
      const possibleMentions = Array.from(Object.values(users)).filter(user =>
        user.nickname.startsWith(splitedMsg[splitedMsg.length - 1].substring(1))
      )
      const sortedMentions = Object.values(possibleMentions).sort(function (a, b) {
        if (a.nickname > b.nickname) {
          return 1
        }
        if (b.nickname > a.nickname) {
          return -1
        }
        return 0
      })
      if (JSON.stringify(mentionsToSelect) !== JSON.stringify(sortedMentions)) {
        setMentionsToSelect(sortedMentions)
        setTimeout(() => {
          setSelected(0)
        }, 0)
      }
      if (possibleMentions.length) {
        splitedMsg[splitedMsg.length - 1] = renderToString(
          <span id={splitedMsg[splitedMsg.length - 1]}>{splitedMsg[splitedMsg.length - 1]}</span>
        )
      }
    } else {
      if (mentionsToSelect.length !== 0) {
        setMentionsToSelect([])
      }
    }
    for (const key in splitedMsg) {
      const element = splitedMsg[key]
      if (
        element.startsWith('@') &&
        Array.from(Object.values(users)).find(user => user.nickname === element.substring(1))
      ) {
        splitedMsg[key] = renderToString(<span className={classes.highlight}>{element}</span>)
        if (key === splitedMsg.length) {
          setMentionsToSelect([])
        }
      }
    }
    return splitedMsg.join(String.fromCharCode(160))
  }

  const t2 = sanitizeHtml(htmlMessage)
  const sanitizedHtml = findMentions(t2)
  const onChangeCb = useCallback(
    e => {
      if (inputState === INPUT_STATE.AVAILABLE) {
        setMessage(e.nativeEvent.target.innerText)
        if (!e.nativeEvent.target.innerText) {
          setHtmlMessage('')
        } else {
          setHtmlMessage(e.target.value)
        }
      }
      setAnchorEl(e.currentTarget.lastElementChild)
    },
    [setAnchorEl, onChange, setHtmlMessage]
  )
  const inputStateRef = React.useRef(inputState)
  React.useEffect(() => {
    inputStateRef.current = inputState
  })

  const onKeyDownCb = useCallback(
    e => {
      if (refMentionsToSelect.current.length) {
        if (e.nativeEvent.keyCode === 40) {
          if (refSelected.current + 1 >= refMentionsToSelect.current.length) {
            setSelected(0)
          } else {
            setSelected(refSelected.current + 1)
          }
          e.preventDefault()
        }
        if (e.nativeEvent.keyCode === 38) {
          if (refSelected.current - 1 < 0) {
            setSelected(refMentionsToSelect.current.length - 1)
          } else {
            setSelected(refSelected.current - 1)
          }
          e.preventDefault()
        }
        if (e.nativeEvent.keyCode === 13 || e.nativeEvent.keyCode === 9) {
          const currentMsg = message
            .replace(/ /g, String.fromCharCode(160))
            .split(String.fromCharCode(160))
          currentMsg[currentMsg.length - 1] =
            '@' + refMentionsToSelect.current[refSelected.current].nickname
          currentMsg.push(String.fromCharCode(160))
          setHtmlMessage(currentMsg.join(String.fromCharCode(160)))
          e.preventDefault()
        }
        return
      }
      if (
        inputStateRef.current === INPUT_STATE.AVAILABLE &&
        e.nativeEvent.keyCode === 13 &&
        e.target.innerText !== ''
      ) {
        onChange(e.target.innerText)
        onKeyPress(e)
        setMessage('')
        setHtmlMessage('')
        scrollToBottom()
      } else {
        if (e.nativeEvent.keyCode === 13) {
          e.preventDefault()
          if (infoClass !== classNames(classes.backdrop, classes.blinkAnimation)) {
            setInfoClass(classNames(classes.backdrop, classes.blinkAnimation))
            setTimeout(() => setInfoClass(classNames(classes.backdrop)), 1000)
          }
        }
      }
    },
    [
      onChange,
      refMentionsToSelect,
      onKeyPress,
      setMessage,
      setHtmlMessage,
      scrollToBottom,
      infoClass,
      setInfoClass,
      message,
      setSelected,
      inputState
    ]
  )
  return (
    <Grid className={classNames({
      [classes.root]: true,
      [classes.notAllowed]: showInfoMessage
    })}>
      <Grid
        container
        className={classNames({
          [classes.root]: true,
          [classes.displayNone]: showInfoMessage
        })}
        direction='column'
        justify='center'>
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
                setMessage(currentMsg.join(String.fromCharCode(160)))
                setHtmlMessage(currentMsg.join(String.fromCharCode(160)))
                inputRef.current.el.current.focus()
              }}
            />
          ))}
        </MentionPoper>
        <Grid
          container
          direction='row'
          alignItems='center'
          justify='center'
          spacing={0}
          className={classNames({
            [classes.disabledBottomMargin]: isMessageTooLong,
            [classes.inputsDiv]: true
          })}>
          <ClickAwayListener
            onClickAway={() => {
              setFocused(false)
            }}>
            <Grid
              item
              xs
              container
              className={classNames({
                [classes.textfield]: true,
                [classes.focused]: focused
              })}
              justify='center'
              alignItems='center'>
              <Grid item xs>
                <ContentEditable
                  ref={inputRef}
                  placeholder={`Message ${inputPlaceholder}`}
                  className={classes.input}
                  onClick={() => {
                    if (!focused) {
                      setFocused(true)
                    }
                  }}
                  html={sanitizedHtml}
                  onChange={onChangeCb}
                  onKeyDown={onKeyDownCb}
                />
              </Grid>
              <Grid item className={classes.actions}>
                <Grid container justify='center' alignItems='center'>
                  <ChannelInputAction disabled={inputState !== INPUT_STATE.AVAILABLE} />
                  <Icon
                    className={classes.emoji}
                    src={emojiHovered ? emojiBlack : emojiGray}
                    onClickHandler={() => {
                      setOpenEmoji(true)
                    }}
                    onMouseEnterHandler={() => {
                      setEmojiHovered(true)
                    }}
                    onMouseLeaveHandler={() => {
                      setEmojiHovered(false)
                    }}
                  />
                </Grid>
                {openEmoji && (
                  <ClickAwayListener
                    onClickAway={() => {
                      setOpenEmoji(false)
                    }}>
                    <div className={classes.picker}>
                      <Picker
                        /* eslint-disable */
                        onEmojiClick={(e, emoji) => {
                          setHtmlMessage(message + emoji.emoji)
                          setMessage(message + emoji.emoji)
                          setOpenEmoji(false)
                        }}
                      /* eslint-enable */
                      />
                    </div>
                  </ClickAwayListener>
                )}
              </Grid>
            </Grid>
          </ClickAwayListener>
        </Grid>
        {isMessageTooLong && (
          <Grid container item className={classes.errorBox}>
            <Grid className={classes.errorIcon} item>
              <Icon src={errorIcon} />
            </Grid>
            <Grid item>
              <Typography className={classes.errorText} variant={'caption'}>
                {'Your message is over the size limit. '}
                <span
                  /* eslint-disable */
                  onClick={() =>
                    shell.openExternal('https://www.zbay.app/faq.html#message-size-info')
                  }
                  /* eslint-enable */
                  className={classes.linkBlue}>
                  Learn More
                </span>
              </Typography>
            </Grid>
          </Grid>
        )}
        <ChannelInputInfoMessage showInfoMessage={showInfoMessage} inputState={inputState} />
      </Grid>
    </Grid>
  )
}

ChannelInput.defaultProps = {
  inputState: INPUT_STATE.AVAILABLE,
  members: new Set(),
  channelName: ''
}

export default ChannelInput
