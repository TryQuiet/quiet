import React, { ReactElement, useCallback } from 'react'
import classNames from 'classnames'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import Picker, { EmojiStyle } from 'emoji-picker-react'
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import orange from '@mui/material/colors/orange'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import ChannelInputInfoMessage from './ChannelInputInfoMessage'
import { INPUT_STATE } from './InputState.enum'
import Icon from '../../../ui/Icon/Icon'
import emojiGray from '../../../../static/images/emojiGray.svg'
import emojiBlack from '../../../../static/images/emojiBlack.svg'
import paperclipGray from '../../../../static/images/paperclipGray.svg'
import paperclipBlack from '../../../../static/images/paperclipBlack.svg'
import path from 'path'

const PREFIX = 'ChannelInput'

const classes = {
  root: `${PREFIX}root`,
  rootContent: `${PREFIX}rootContent`,
  input: `${PREFIX}input`,
  textfield: `${PREFIX}textfield`,
  inputsDiv: `${PREFIX}inputsDiv`,
  disabledBottomMargin: `${PREFIX}disabledBottomMargin`,
  warningIcon: `${PREFIX}warningIcon`,
  blinkAnimation: `${PREFIX}blinkAnimation`,
  backdrop: `${PREFIX}backdrop`,
  focused: `${PREFIX}focused`,
  iconButton: `${PREFIX}iconButton`,
  emoji: `${PREFIX}emoji`,
  highlight: `${PREFIX}highlight`,
  actions: `${PREFIX}actions`,
  picker: `${PREFIX}picker`,
  errorIcon: `${PREFIX}errorIcon`,
  errorText: `${PREFIX}errorText`,
  errorBox: `${PREFIX}errorBox`,
  linkBlue: `${PREFIX}linkBlue`,
  notAllowed: `${PREFIX}notAllowed`,
  inputFiles: `${PREFIX}inputFiles`,
  icons: `${PREFIX}icons`
}

const StyledChannelInput = styled(Grid)((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    background: '#fff',
    height: '100%',
    width: '100%'
  },
  [`& .${classes.rootContent}`]: {
    background: '#fff',
    height: '100%',
    width: '100%'
  },
  '@keyframes blinker': {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  [`& .${classes.input}`]: {
    whiteSpace: 'break-spaces',
    width: '100%',
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
    wordBreak: 'break-word',
    position: 'relative',
    paddingRight: '60px'
  },
  [`& .${classes.textfield}`]: {
    border: `1px solid ${theme.palette.colors.veryLightGray}`,
    maxHeight: 300,
    overflowY: 'auto',
    borderRadius: 4,
    '&:hover': {
      borderColor: theme.palette.colors.trueBlack
    },
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flexStart',
    alignItems: 'stretch',
    alignContent: 'stretch',
    width: '100%',
    position: 'relative'
  },
  [`& .${classes.inputsDiv}`]: {
    paddingLeft: '20px',
    paddingRight: '20px',
    width: '100%',
    margin: '0px',
    position: 'relative'
  },
  [`& .${classes.disabledBottomMargin}`]: {
    marginBottom: 0
  },
  [`& .${classes.warningIcon}`]: {
    color: orange[500]
  },
  [`& .${classes.blinkAnimation}`]: {
    animationName: '$blinker',
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 1
  },
  [`& .${classes.backdrop}`]: {
    height: 'auto',
    padding: theme.spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    WebkitTapHighlightColor: 'transparent',
    pointerEvents: 'none',
    touchAction: 'none'
  },
  [`& .${classes.focused}`]: {
    borderColor: theme.palette.colors.trueBlack
  },
  [`& .${classes.iconButton}`]: {
    cursor: 'pointer',
    position: 'relative',
    float: 'right',
    color: '#808080',
    '&:hover': {
      color: 'black',
      border: '1px solid black'

    },
    border: '1px solid #808080',
    // boxShadow: '-.75px -.75px 1px #808080',
    borderRadius: '100%',
    width: '23px',
    height: '23px'
  },
  [`& .${classes.emoji}`]: {
    cursor: 'pointer',
    position: 'relative',
    float: 'right'
  },
  [`& .${classes.highlight}`]: {
    color: theme.palette.colors.lushSky,
    backgroundColor: theme.palette.colors.lushSky12,
    padding: 5,
    borderRadius: 4
  },
  [`& .${classes.actions}`]: {
    postion: 'relative',
    float: 'right',
    padding: '5px'
  },
  [`& .${classes.picker}`]: {
    position: 'fixed',
    bottom: 60,
    right: 15
  },
  [`& .${classes.errorIcon}`]: {
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 5
  },
  [`& .${classes.errorText}`]: {
    color: theme.palette.colors.trueBlack
  },
  [`& .${classes.errorBox}`]: {
    marginTop: 5
  },
  [`& .${classes.linkBlue}`]: {
    fontWeight: 'normal',
    fontStyle: 'normal',
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  [`& .${classes.notAllowed}`]: {
    cursor: 'not-allowed'
  },
  [`& .${classes.inputFiles}`]: {
    position: 'relative',
    float: 'left'
  },
  [`& .${classes.icons}`]: {
    position: 'absolute',
    float: 'left',
    right: '0px',
    bottom: '0px',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flexStart',
    alignItems: 'center',
    alignCntent: 'stretch'
  }
}))

export interface ChannelInputProps {
  channelId: string
  channelName?: string
  channelParticipants?: Array<{ nickname: string }>
  inputPlaceholder: string
  inputState?: INPUT_STATE
  initialMessage?: string
  onChange: (arg: string) => void
  onKeyPress: (input: string) => void
  infoClass: string
  setInfoClass: (arg: string) => void
  children?: ReactElement
  openFilesDialog: () => void
  handleClipboardFiles?: (arg: ArrayBuffer, ext: string, name: string) => void
  handleOpenFiles: (arg: {files: any[]}) => void
}

export const ChannelInputComponent: React.FC<ChannelInputProps> = ({
  channelId,
  channelParticipants = [],
  inputPlaceholder,
  inputState = INPUT_STATE.AVAILABLE,
  initialMessage = '',
  onChange,
  onKeyPress,
  infoClass,
  setInfoClass,
  children,
  openFilesDialog,
  handleClipboardFiles,
  handleOpenFiles
}) => {
  const [_anchorEl, setAnchorEl] = React.useState<HTMLDivElement>(null)
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])
  const messageRef = React.useRef<string>()
  const refSelected = React.useRef<number>()
  const isFirstRenderRef = React.useRef(true)

  const mentionsToSelectRef = React.useRef<any[]>()

  const inputRef = React.createRef<ContentEditable & HTMLDivElement & any>() // any for updater.enqueueForceUpdate

  const fileInput = React.useRef(null)

  const [focused, setFocused] = React.useState(false)
  const [selected, setSelected] = React.useState(0)

  const [emojiHovered, setEmojiHovered] = React.useState(false)
  const [fileExplorerHovered, setFileExplorerHovered] = React.useState(false)
  const [openEmoji, setOpenEmoji] = React.useState(false)

  const [htmlMessage, setHtmlMessage] = React.useState<string>(initialMessage)
  const [message, setMessage] = React.useState(initialMessage)

  React.useEffect(() => {
    inputRef.current?.el.current.focus()
  }, [inputRef])

  React.useEffect(() => {
    inputRef.current.updater.enqueueForceUpdate(inputRef.current)
  }, [inputPlaceholder, channelId])

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
  }, [channelId])

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
          console.log('Returning wrapped mentions', nickname)
          return `<span>@${nickname}</span>`
        }
      )

      return result
    },
    [mentionsToSelect, setMentionsToSelect]
  )

  const sanitizedHtml = findMentions(htmlMessage)

  const caretLineTraversal = (focusLine: Node, anchorLinePosition: number) => {
    // Create an empty range
    const range = document.createRange()
    // Set the focusLineLength
    // Make it zero if between newlines
    const focusLineLength = focusLine?.nodeValue?.length || 0
    // Set the range start to the position on the anchor line
    // or the focus line length, whichever is shorter
    range.setStart(
      focusLine,
      anchorLinePosition < focusLineLength ? anchorLinePosition : focusLineLength
    )
    // Remove the range from the anchor line
    const selection = window.getSelection()
    selection.removeAllRanges()
    // and set it to the focus line
    selection.addRange(range)
  }

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

      if (e.key === 'ArrowDown') {
        const anchorNode = window.getSelection().anchorNode

        // If the current line is empty, go directly to the next node.
        let nextNode: Node = null
        if (anchorNode.nodeValue === null || anchorNode.nodeValue === '\n') {
          nextNode = anchorNode?.nextSibling
        } else {
          // Otherwise skip the break node at the end of the current line.
          nextNode = anchorNode?.nextSibling.nextSibling
        }
        // If we're on the bottom line, go to the end
        if (!nextNode) {
          const endOfNode = anchorNode?.nodeValue?.length || anchorNode.textContent.length
          caretLineTraversal(anchorNode, endOfNode)
          return
        }
        // If the next line is empty, go the beginning
        if (nextNode.nodeValue === null || nextNode.nodeValue === '\n') {
          caretLineTraversal(nextNode, 0)
          return
        }
        caretLineTraversal(nextNode, window.getSelection().anchorOffset)
      }
      if (e.key === 'ArrowUp') {
        const anchorNode = window.getSelection().anchorNode

        // If pervious line is empty, go directly to it
        let previousNode: Node = null
        if (
          anchorNode?.previousSibling?.previousSibling.nodeValue === null ||
          anchorNode?.previousSibling?.previousSibling.nodeValue === '\n'
        ) {
          previousNode = anchorNode?.previousSibling
        } else {
          // Otherwise skip the break node at the end of the previous line
          previousNode = anchorNode?.previousSibling?.previousSibling
        }
        // If we're on the top line, go to the beginning
        if (!previousNode) {
          caretLineTraversal(anchorNode, 0)
          return
        }
        // If previous line is empty, go to the beginning
        if (previousNode.nodeValue === null || previousNode.nodeValue === '\n') {
          caretLineTraversal(previousNode, 0)
          return
        }
        caretLineTraversal(previousNode, window.getSelection().anchorOffset)
      }

      if (e.nativeEvent.keyCode === 13) {
        if (e.shiftKey) {
          // Accept this input for additional lines in the message box
        } else if (inputStateRef.current === INPUT_STATE.AVAILABLE) {
          e.preventDefault()
          onChange(e.target.innerText)
          onKeyPress(e.target.innerText)
          setMessage('')
          setHtmlMessage('')
        } else {
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
      infoClass,
      setInfoClass,
      setSelected
    ]
  )

  const handleFileInput = (e) => {
    handleOpenFiles({ files: Object.values(e.target.files) })
  }

  return (
    <StyledChannelInput
      className={classNames({
        [classes.root]: true,
        [classes.notAllowed]: inputState !== INPUT_STATE.AVAILABLE
      })}
    >
      <Grid
        container
        className={classNames({
          [classes.rootContent]: true
        })}
        direction='column'
        justifyContent='center'>
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
          justifyContent='center'
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
              justifyContent='center'
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
                  disabled={inputState !== INPUT_STATE.AVAILABLE}
                  html={sanitizedHtml}
                  onChange={onChangeCb}
                  onKeyDown={onKeyDownCb}
                  onPaste={async (e) => {
                    e.preventDefault()
                    const files = e.clipboardData.files
                    for (let i = 0; i < files.length; i++) {
                      const fileExt = path.extname(files[i].name).toLowerCase()
                      const fileName = path.basename(files[i].name, fileExt)
                      const arrayBuffer = await files[i].arrayBuffer()
                      handleClipboardFiles(arrayBuffer, fileExt, fileName)
                    }
                    if (!files.length) {
                      const text = e.clipboardData
                        .getData('text/plain')
                        .replace(/(\r\n|\r|\n)/g, '<br />')
                      document.execCommand('insertHTML', false, text)
                    }
                  }}
                  data-testid='messageInput'
                />
              </Grid>
              {children}
              <div className={classes.icons}>
                <Grid item className={classes.actions}>
                  <Grid container justifyContent='center' alignItems='center'>
                    <Icon
                      className={classes.emoji}
                      src={fileExplorerHovered ? paperclipBlack : paperclipGray}
                      onClickHandler={() => fileInput.current?.click()}
                      onMouseEnterHandler={() => {
                        setFileExplorerHovered(true)
                      }}
                      onMouseLeaveHandler={() => {
                        setFileExplorerHovered(false)
                      }}
                    />
                    <input
                      ref={fileInput}
                      type='file'
                      onChange={handleFileInput}
                      // Value needs to be cleared otherwise one can't upload same image twice
                      onClick={(e) => { (e.target as HTMLInputElement).value = null }}
                      accept='*'
                      multiple
                      hidden
                    />
                  </Grid>
                </Grid>
                <Grid item className={classes.actions}>
                  <Grid container justifyContent='center' alignItems='center'>
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
                      <div data-testid={'emoji-picker'} className={classes.picker}>
                        <Picker
                          onEmojiClick={(emojiData, _event) => {
                            setHtmlMessage(htmlMessage => htmlMessage + emojiData.emoji)
                            setMessage(message + emojiData.emoji)
                            setOpenEmoji(false)
                          }}
                          // Every other emojiStyle causes downloading emojis from cdn. We do not want that.
                          // Do not change it unless using custom getEmojiUrl with local emojis.
                          emojiStyle={EmojiStyle.NATIVE}
                        />
                      </div>
                    </ClickAwayListener>
                  )}
                </Grid>
              </div>
            </Grid>
          </ClickAwayListener>
        </Grid>
        <ChannelInputInfoMessage
          showInfoMessage={inputState !== INPUT_STATE.AVAILABLE}
        />
      </Grid>
    </StyledChannelInput>
  )
}

export default ChannelInputComponent
