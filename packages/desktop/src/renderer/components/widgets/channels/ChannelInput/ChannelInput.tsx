import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import Picker, { EmojiStyle, SkinTones, type Theme } from 'emoji-picker-react'
import Grid from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'
import orange from '@mui/material/colors/orange'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import ChannelInputInfoMessage from './ChannelInputInfoMessage'
import EmojiDropdown from './EmojiDropdown'
import { INPUT_STATE } from './InputState.enum'
import Icon from '../../../ui/Icon/Icon'
import emojiGray from '../../../../static/images/emojiGray.svg'
import emojiBlack from '../../../../static/images/emojiBlack.svg'
import paperclipGray from '../../../../static/images/paperclipGray.svg'
import paperclipBlack from '../../../../static/images/paperclipBlack.svg'
import path from 'path'
import { emojify, findMatchingEmojis, extractPartialEmojiCode, getEmojiFromShortcode } from './utils/emojiCodes'

const PREFIX = 'ChannelInput'
const MAX_EMOJI_SUGGESTIONS = 100
const SKIN_TONE_KEY = 'emojiPickerSkinTone'

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
  errorBox: `${PREFIX}errorBox`,
  linkBlue: `${PREFIX}linkBlue`,
  notAllowed: `${PREFIX}notAllowed`,
  inputFiles: `${PREFIX}inputFiles`,
  icons: `${PREFIX}icons`,
  portalDropdown: `${PREFIX}portalDropdown`,
}

const maxHeight = 300

const StyledChannelInput = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    background: theme.palette.background.default,
    height: '100%',
    width: '100%',
    overflow: 'visible',
    position: 'relative',
  },
  [`& .${classes.rootContent}`]: {
    background: theme.palette.background.default,
    height: '100%',
    width: '100%',
    overflow: 'visible',
  },
  '@keyframes blinker': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  [`& .${classes.input}`]: {
    display: 'block',
    border: 0,
    resize: 'none',
    fontFamily: '"Rubik", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    whiteSpace: 'break-spaces',
    width: '100%',
    fontSize: 14,
    outline: 'none',
    padding: '12px 16px',
    scrollPaddingBottom: '12px',
    height: '48px',
    lineHeight: '24px',
    backgroundColor: theme.palette.background.default,
    color: theme.palette.colors.contrastText,
    '&:empty': {
      '&:before': {
        content: 'attr(placeholder)',
        display: 'block',
        color: '#aaa',
      },
    },
    '&::placeholder': {
      color: '#aaa',
    },
    wordBreak: 'break-word',
    position: 'relative',
    paddingRight: '60px',
  },
  [`& .${classes.textfield}`]: {
    border: `1px solid ${theme.palette.colors.border01}`,
    maxHeight: maxHeight,
    overflowY: 'auto',
    overflowX: 'visible',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flexStart',
    alignItems: 'stretch',
    alignContent: 'stretch',
    width: '100%',
    position: 'relative',
  },
  [`& .${classes.inputsDiv}`]: {
    paddingLeft: '20px',
    paddingRight: '20px',
    width: '100%',
    margin: '0px',
    position: 'relative',
    overflow: 'visible',
  },
  [`& .${classes.disabledBottomMargin}`]: {
    marginBottom: 0,
  },
  [`& .${classes.warningIcon}`]: {
    color: orange[500],
  },
  [`& .${classes.blinkAnimation}`]: {
    animationName: '$blinker',
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 1,
  },
  [`& .${classes.backdrop}`]: {
    height: 'auto',
    padding: theme.spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    WebkitTapHighlightColor: 'transparent',
    pointerEvents: 'none',
    touchAction: 'none',
  },
  [`& .${classes.iconButton}`]: {
    cursor: 'pointer',
    position: 'relative',
    float: 'right',
    color: '#808080',
    '&:hover': {
      color: 'black',
      border: '1px solid black',
    },
    border: '1px solid #808080',
    // boxShadow: '-.75px -.75px 1px #808080',
    borderRadius: '100%',
    width: '23px',
    height: '23px',
  },
  [`& .${classes.emoji}`]: {
    cursor: 'pointer',
    position: 'relative',
    float: 'right',
  },
  [`& .${classes.highlight}`]: {
    color: theme.palette.colors.lushSky,
    backgroundColor: theme.palette.colors.lushSky12,
    padding: 5,
    borderRadius: 4,
  },
  [`& .${classes.actions}`]: {
    postion: 'relative',
    float: 'right',
    padding: '5px',
  },
  [`& .${classes.picker}`]: {
    bottom: 60,
    right: 15,
    left: 'auto',
    maxWidth: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    position: 'fixed',
    width: 'min(350px, calc(100vw - 40px))',
    maxHeight: 'min(450px, calc(100vh - 120px))',
  },
  [`& .${classes.errorIcon}`]: {
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 5,
  },
  [`& .${classes.errorBox}`]: {
    marginTop: 5,
  },
  [`& .${classes.linkBlue}`]: {
    fontWeight: 'normal',
    fontStyle: 'normal',
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue,
  },
  [`& .${classes.notAllowed}`]: {
    cursor: 'not-allowed',
  },
  [`& .${classes.inputFiles}`]: {
    position: 'relative',
    float: 'left',
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
    alignCntent: 'stretch',
  },
}))

export interface ChannelInputProps {
  channelId: string
  channelName?: string
  inputPlaceholder: string
  inputState?: INPUT_STATE
  initialMessage?: string
  onChange: (arg: string) => void
  onKeyPress: (input: string) => void
  infoClass: string
  setInfoClass: (arg: string) => void
  children?: ReactElement
  openFilesDialog: () => void
  handleClipboardFiles: (arg: ArrayBuffer, ext: string, name: string) => void
  handleOpenFiles: (arg: { files: any[] }) => void
}

export const ChannelInputComponent: React.FC<ChannelInputProps> = ({
  channelId,
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
  handleOpenFiles,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const fileInput = React.useRef<HTMLInputElement>(null)

  const [focused, setFocused] = React.useState(false)

  const [emojiHovered, setEmojiHovered] = React.useState(false)
  const [fileExplorerHovered, setFileExplorerHovered] = React.useState(false)
  const [openEmoji, setOpenEmoji] = React.useState(false)

  // State for emoji dropdown
  const [emojiSuggestions, setEmojiSuggestions] = React.useState<string[]>([])
  const [partialEmoji, setPartialEmoji] = React.useState<string | null>(null)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState(-1)

  // Ref for the textarea container to position the emoji dropdown
  const textareaContainerRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = React.useState(initialMessage)

  const theme = useTheme()

  React.useEffect(() => {
    setMessage(initialMessage)
    const ref = textAreaRef.current
    if (!ref) return
    if (!initialMessage) return
    adjustTextAreaHeight(ref)
  }, [channelId])

  React.useEffect(() => {
    textAreaRef.current?.focus()
  }, [textAreaRef])

  const adjustTextAreaHeight = (el: HTMLTextAreaElement) => {
    // Workaround for making textarea's height adapt to the content
    el.style.height = ''
    if (el.scrollHeight > el.clientHeight) {
      el.style.height = `${el.scrollHeight}px`
    }
  }

  const onChangeCb = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (inputState === INPUT_STATE.AVAILABLE) {
        // Get cursor position and current input value
        const cursorPosition = e.target.selectionStart || 0
        const currentText = e.target.value

        // First, just update the text as typed (without emoji conversion)
        setMessage(currentText)

        // Check for potential emoji shortcode to provide tab completion suggestions
        const partialCode = extractPartialEmojiCode(currentText, cursorPosition)
        if (partialCode && partialCode.partial.length > 1) {
          // At least ":x"
          const matches = findMatchingEmojis(partialCode.partial, MAX_EMOJI_SUGGESTIONS)
          // Use matches as is - if no matches, don't show any fallbacks
          setEmojiSuggestions(matches)
          setPartialEmoji(partialCode.partial)
          // Reset selection to first item when suggestions change
          setSelectedSuggestionIndex(0)
        } else {
          // Clear suggestions if not typing an emoji code
          setEmojiSuggestions([])
          setPartialEmoji(null)
        }

        // Check for emoji conversion at current cursor position
        const result = emojify(currentText, cursorPosition) as { text: string; cursorOffset: number }
        const { text: newText, cursorOffset } = result

        // If emoji conversion occurred, update the text and fix cursor position
        if (newText !== currentText) {
          setMessage(newText)

          // Set timeout to fix cursor position after React renders
          setTimeout(() => {
            if (e.target) {
              const newPosition = cursorPosition + cursorOffset
              e.target.selectionStart = newPosition
              e.target.selectionEnd = newPosition
            }
          }, 0)
        }

        // Update textarea height to fit content
        adjustTextAreaHeight(e.target)
      }
    },
    [inputState, message]
  )

  const inputStateRef = React.useRef(inputState)
  React.useEffect(() => {
    inputStateRef.current = inputState
  })

  // State to track emoji autocomplete dropdown position
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })

  // Update dropdown position whenever suggestions change or textarea size changes
  React.useEffect(() => {
    if (emojiSuggestions.length > 0 && textareaContainerRef.current && textAreaRef.current) {
      const container = textareaContainerRef.current
      const textarea = textAreaRef.current
      const containerRect = container.getBoundingClientRect()
      const textareaRect = textarea.getBoundingClientRect()

      // Calculate the height of the dropdown (max 5 items)
      const dropdownHeight = Math.min(emojiSuggestions.length, 5) * 40 + 10 // approx. height per item + padding

      setDropdownPosition({
        top: textareaRect.top - dropdownHeight - 10, // Position above the textarea with a 10px gap
        left: textareaRect.left,
        width: textareaRect.width,
      })
    }
  }, [emojiSuggestions, message])

  const onKeyDownCb = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLInputElement

      if (emojiSuggestions.length > 0 && (e.nativeEvent.key === 'ArrowUp' || e.nativeEvent.key === 'ArrowDown')) {
        // Handle arrow navigation for emoji suggestions
        e.preventDefault()

        if (e.nativeEvent.key === 'ArrowDown') {
          // Move selection down
          setSelectedSuggestionIndex(prev => (prev < emojiSuggestions.length - 1 ? prev + 1 : 0))
        } else {
          // Move selection up
          setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : emojiSuggestions.length - 1))
        }
      } else if (e.nativeEvent.key === 'Tab' || (e.nativeEvent.key === 'Enter' && emojiSuggestions.length > 0)) {
        // Handle Tab or Enter key (when emoji dropdown is visible) for emoji shortcodes
        e.preventDefault() // Prevent focus change or form submission

        const cursorPos = target.selectionStart || 0
        const partial = extractPartialEmojiCode(target.value, cursorPos)

        if (partial && emojiSuggestions.length > 0) {
          // Use the currently selected suggestion
          const selectedSuggestion = emojiSuggestions[selectedSuggestionIndex]

          // Get the actual emoji character
          const emoji = getEmojiFromShortcode(selectedSuggestion)

          // Calculate the new text with emoji inserted
          const beforeText = target.value.substring(0, partial.startPos)
          const afterText = target.value.substring(cursorPos)
          const newText = beforeText + emoji + afterText

          // Calculate new cursor position
          const newCursorPos = partial.startPos + emoji.length

          setMessage(newText)
          // Reset suggestions and selection index
          setEmojiSuggestions([])
          setSelectedSuggestionIndex(0)

          // Set cursor position after the component re-renders
          setTimeout(() => {
            if (target) {
              target.selectionStart = newCursorPos
              target.selectionEnd = newCursorPos
            }
          }, 0)

          // If the key was Enter, we're done - don't proceed to the Enter handling below
          if (e.nativeEvent.key === 'Enter') {
            return
          }
        }
      } else if (e.nativeEvent.key === 'Enter') {
        if (e.shiftKey) {
          // Accept this input for additional lines in the message box
        } else if (inputStateRef.current === INPUT_STATE.AVAILABLE) {
          e.preventDefault()
          // On send, replace any remaining emoji shortcodes with actual emojis
          const messageWithEmojis = emojify(target.value, { finalSend: true }) as string
          onChange(messageWithEmojis)
          onKeyPress(messageWithEmojis)
          setMessage('')
          // Reset any state needed for emoji handling
          setEmojiSuggestions([])
          target.style.height = ''
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
      onChange,
      onKeyPress,
      setMessage,
      infoClass,
      setInfoClass,
      emojiSuggestions,
      selectedSuggestionIndex,
    ]
  )

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    if (!target.files) return
    handleOpenFiles({ files: Object.values(target.files) })
  }

  const handleSkinToneChange = (newTone: SkinTones) => {
    setSkinTone(newTone)
    localStorage.setItem(SKIN_TONE_KEY, newTone)
  }

  const [skinTone, setSkinTone] = useState(SkinTones.NEUTRAL)

  useEffect(() => {
    const savedTone = localStorage.getItem(SKIN_TONE_KEY)
    if (savedTone) {
      setSkinTone(savedTone as SkinTones)
    }
  }, [])

  return (
    <StyledChannelInput
      className={classNames({
        [classes.root]: true,
        [classes.notAllowed]: inputState !== INPUT_STATE.AVAILABLE,
      })}
    >
      <Grid
        container
        className={classNames({
          [classes.rootContent]: true,
        })}
        direction='column'
        justifyContent='center'
      >
        <Grid
          container
          direction='row'
          alignItems='center'
          justifyContent='center'
          spacing={0}
          className={classNames({
            [classes.inputsDiv]: true,
          })}
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
                [classes.focused]: focused,
              })}
              justifyContent='center'
              alignItems='center'
            >
              <div ref={textareaContainerRef} style={{ position: 'relative', width: '100%' }}>
                {emojiSuggestions.length > 0 && (
                  <EmojiDropdown
                    suggestions={emojiSuggestions}
                    selectedIndex={selectedSuggestionIndex}
                    position={dropdownPosition}
                    onClickAway={() => {
                      setEmojiSuggestions([])
                      setPartialEmoji(null)
                      setSelectedSuggestionIndex(-1)
                    }}
                    onEmojiSelect={suggestion => {
                      // Apply this emoji when clicked
                      const cursorPos = textAreaRef.current?.selectionStart || 0
                      const partial = extractPartialEmojiCode(message, cursorPos)

                      if (partial) {
                        // Replace the partial emoji code with the actual emoji
                        const emoji = getEmojiFromShortcode(suggestion)

                        // Calculate the new text with emoji inserted
                        const beforeText = message.substring(0, partial.startPos)
                        const afterText = message.substring(cursorPos)
                        const newText = beforeText + emoji + afterText

                        // Calculate new cursor position
                        const newCursorPos = partial.startPos + emoji.length

                        setMessage(newText)
                        setEmojiSuggestions([])
                        setSelectedSuggestionIndex(0)

                        // Set cursor position after click
                        setTimeout(() => {
                          if (textAreaRef.current) {
                            textAreaRef.current.selectionStart = newCursorPos
                            textAreaRef.current.selectionEnd = newCursorPos
                            textAreaRef.current.focus()
                          }
                        }, 0)
                      }
                    }}
                  />
                )}
              </div>
              <textarea
                ref={textAreaRef}
                placeholder={`Message ${inputPlaceholder}`}
                className={classes.input}
                onClick={() => {
                  if (!focused) {
                    setFocused(true)
                  }
                }}
                value={message}
                disabled={inputState !== INPUT_STATE.AVAILABLE}
                onChange={onChangeCb}
                onKeyDown={onKeyDownCb}
                onPaste={async e => {
                  const files = e.clipboardData.files
                  if (files.length) e.preventDefault()
                  for (let i = 0; i < files.length; i++) {
                    const fileExt = path.extname(files[i].name).toLowerCase()
                    const fileName = path.basename(files[i].name, fileExt)
                    const arrayBuffer = await files[i].arrayBuffer()
                    handleClipboardFiles(arrayBuffer, fileExt, fileName)
                  }
                }}
                data-testid='messageInput'
              />
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
                      data-testid='uploadFileInput'
                      ref={fileInput}
                      type='file'
                      onChange={handleFileInput}
                      // Value needs to be cleared otherwise one can't attach same image twice
                      onClick={e => {
                        ;(e.target as HTMLInputElement).value = ''
                      }} // TODO: check
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
                      }}
                    >
                      <div data-testid={'emoji-picker'} className={classes.picker}>
                        <Picker
                          onEmojiClick={(emojiData, _event) => {
                            setMessage(message + emojiData.emoji)
                            setOpenEmoji(false)
                          }}
                          // Every other emojiStyle causes downloading emojis from cdn. We do not want that.
                          // Do not change it unless using custom getEmojiUrl with local emojis.
                          emojiStyle={EmojiStyle.NATIVE}
                          defaultSkinTone={skinTone}
                          onSkinToneChange={handleSkinToneChange} // persist changes
                          theme={theme.palette.mode as Theme}
                        />
                      </div>
                    </ClickAwayListener>
                  )}
                </Grid>
              </div>
            </Grid>
          </ClickAwayListener>
        </Grid>
        <ChannelInputInfoMessage showInfoMessage={inputState !== INPUT_STATE.AVAILABLE} />
      </Grid>
    </StyledChannelInput>
  )
}

export default ChannelInputComponent
