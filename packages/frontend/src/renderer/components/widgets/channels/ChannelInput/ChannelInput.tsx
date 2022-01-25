import React, { useCallback } from 'react'
import classNames from 'classnames'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import Picker from 'emoji-picker-react'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import orange from '@material-ui/core/colors/orange'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import ChannelInputInfoMessage from './ChannelInputInfoMessage'
import { INPUT_STATE } from './InputState.enum'
import Icon from '../../../ui/Icon/Icon'
import emojiGray from '../../../../static/images/emojiGray.svg'
import emojiBlack from '../../../../static/images/emojiBlack.svg'

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

export interface ChannelInputProps {
  channelAddress: string
  channelName?: string
  channelParticipants?: Array<{ nickname: string }>
  inputPlaceholder: string
  inputState?: INPUT_STATE
  initialMessage?: string
  onChange: (arg: string) => void
  onKeyPress: (input: string) => void
  infoClass: string
  setInfoClass: (arg: string) => void
}

export const ChannelInputComponent: React.FC<ChannelInputProps> = ({
  channelAddress,
  channelParticipants = [],
  inputPlaceholder,
  inputState = INPUT_STATE.AVAILABLE,
  initialMessage = '',
  onChange,
  onKeyPress,
  infoClass,
  setInfoClass
}) => {
  const classes = useStyles({})

  const [_anchorEl, setAnchorEl] = React.useState<HTMLDivElement>(null)
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])

  const messageRef = React.useRef<string>()
  const refSelected = React.useRef<number>()
  const isFirstRenderRef = React.useRef(true)

  const mentionsToSelectRef = React.useRef<any[]>()

  const inputRef = React.createRef<ContentEditable & HTMLDivElement & any>() // any for updater.enqueueForceUpdate

  const [focused, setFocused] = React.useState(false)
  const [selected, setSelected] = React.useState(0)

  const [emojiHovered, setEmojiHovered] = React.useState(false)
  const [openEmoji, setOpenEmoji] = React.useState(false)

  const [htmlMessage, setHtmlMessage] = React.useState<string>(initialMessage)
  const [message, setMessage] = React.useState(initialMessage)

  window.onfocus = () => {
    inputRef?.current?.el.current.focus()
    setFocused(true)
  }

  const scrollToBottom = () => {
    const scroll = document.getElementById('messages-scroll')?.parentElement
    setTimeout(() => {
      if (scroll?.scrollTop) {
        scroll.scrollTop = scroll.scrollHeight
      }
    }, 100)
  }

  React.useEffect(() => {
    inputRef.current.updater.enqueueForceUpdate(inputRef.current)
  }, [inputPlaceholder, channelAddress])

  // Use reference to bypass memorization
  React.useEffect(() => {
    refSelected.current = selected
  }, [selected])

  const isRefSelected = (refSelected: number | undefined): refSelected is number => {
    return typeof refSelected === 'number'
  }

  React.useEffect(() => {
    mentionsToSelectRef.current = mentionsToSelect
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
        if (messageRef?.current) {
          onChange(messageRef.current)
        }
      }
    }
    isFirstRenderRef.current = false
  }, [channelAddress])

  React.useEffect(() => {
    messageRef.current = message
  }, [message])

  const findMentions = React.useCallback(
    (text: string) => {
      // Search for any mention in message string
      const result: string = text.replace(
        /(<span([^>]*)>)?@([a-z0-9]?\w*)(<\/span>)?/gi,
        (match, span, _class, nickname) => {
          // Ignore already established mentions
          if (span?.includes('class')) {
            return match
          }

          nickname = nickname ?? ''
          const possibleMentions = channelParticipants.filter(
            user =>
              user.nickname.startsWith(nickname) &&
              !channelParticipants.find(user => user.nickname === nickname)
          )

          if (JSON.stringify(mentionsToSelect) !== JSON.stringify(possibleMentions)) {
            setMentionsToSelect(possibleMentions)
            setTimeout(() => {
              setSelected(0)
            }, 0)
          }

          // Wrap mention in spans to be able to treat it as an anchor for popper
          return `<span>@${nickname}</span>`
        }
      )

      return result
    },
    [mentionsToSelect, setMentionsToSelect]
  )

  const sanitizedHtml = findMentions(htmlMessage)

  const onChangeCb = useCallback(
    (e: ContentEditableEvent) => {
      if (inputState === INPUT_STATE.AVAILABLE) {
        // @ts-expect-error
        setMessage(e.nativeEvent.target.innerText)
        // @ts-expect-error
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

  const mentionSelectAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    const nickname = mentionsToSelectRef.current[refSelected.current].nickname
    setHtmlMessage(htmlMessage => {
      const wrapped = `<span class="${classes.highlight}">@${nickname}</span>&nbsp;`
      return htmlMessage.replace(/<span>[^/]*<\/span>$/g, wrapped)
    })
    // Replace mentions characters with full nickname in original message string
    setMessage(message.replace(/(\b(\w+)$)/, `${nickname} `))
    // Clear popper items after choosing mention
    setMentionsToSelect([])
    inputRef.current?.el.current.focus()
  }

  const onKeyDownCb = useCallback(
    e => {
      if (!isRefSelected(refSelected.current)) {
        throw new Error('refSelected is on unexpected type')
      }
      if (!mentionsToSelectRef?.current) {
        return
      }
      if (mentionsToSelectRef.current.length) {
        if (e.nativeEvent.keyCode === 40) {
          if (refSelected.current + 1 >= mentionsToSelectRef.current.length) {
            setSelected(0)
          } else {
            setSelected(refSelected.current + 1)
          }
          e.preventDefault()
        }
        if (e.nativeEvent.keyCode === 38) {
          if (refSelected.current - 1 < 0) {
            setSelected(mentionsToSelectRef.current.length - 1)
          } else {
            setSelected(refSelected.current - 1)
          }
          e.preventDefault()
        }
        if (e.nativeEvent.keyCode === 13 || e.nativeEvent.keyCode === 9) {
          mentionSelectAction(e)
        }
      }

      if (
        inputStateRef.current === INPUT_STATE.AVAILABLE &&
        e.nativeEvent.keyCode === 13 &&
        e.target.innerText !== ''
      ) {
        e.preventDefault()
        onChange(e.target.innerText)
        onKeyPress(e.target.innerText)
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
      inputState,
      message,
      mentionsToSelectRef,
      onChange,
      onKeyPress,
      setMessage,
      setHtmlMessage,
      scrollToBottom,
      infoClass,
      setInfoClass,
      setSelected
    ]
  )

  return (
    <Grid
      className={classNames({
        [classes.root]: true,
        [classes.notAllowed]: inputState !== INPUT_STATE.AVAILABLE
      })}>
      <Grid
        container
        className={classNames({
          [classes.root]: true
        })}
        direction='column'
        justify='center'>
        {/* <MentionPoper anchorEl={anchorEl} selected={selected}>
          {mentionsToSelect.map((target, index) => (
            <MentionElement
              key={index}
              name={target.nickname}
              highlight={index === selected}
              onMouseEnter={() => {
                setSelected(index)
              }}
              channelName={channelName}
              onClick={e => {
                mentionSelectAction(e)
              }}
            />
          ))}
        </MentionPoper> */}
        <Grid
          container
          direction='row'
          alignItems='center'
          justify='center'
          spacing={0}
          className={classNames({
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
                          setHtmlMessage(htmlMessage => htmlMessage + emoji.emoji)
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
        <ChannelInputInfoMessage
          showInfoMessage={inputState !== INPUT_STATE.AVAILABLE}
          inputState={inputState}
        />
      </Grid>
    </Grid>
  )
}

export default ChannelInputComponent
