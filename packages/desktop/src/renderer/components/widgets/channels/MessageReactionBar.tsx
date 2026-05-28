import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import { reactions, publicChannels } from '@quiet/state-manager'
import Picker, { EmojiStyle, type Theme } from 'emoji-picker-react'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { useTheme } from '@mui/material/styles'
import emojiGray from '../../../static/images/emojiGray.svg'

const QUICK_REACTIONS = ['👍', '👎', '😄', '🎉', '😕', '❤️']

const PREFIX = 'MessageReactionBar'
const classes = {
  bar: `${PREFIX}-bar`,
  pill: `${PREFIX}-pill`,
  pillActive: `${PREFIX}-pillActive`,
  addBtn: `${PREFIX}-addBtn`,
  picker: `${PREFIX}-picker`,
  quickPicker: `${PREFIX}-quickPicker`,
  quickEmoji: `${PREFIX}-quickEmoji`,
  hiddenPicker: `${PREFIX}-hiddenPicker`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.bar}`]: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '4px',
  },
  [`& .${classes.pill}`]: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    cursor: 'pointer',
    fontSize: '14px',
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  [`& .${classes.pillActive}`]: {
    border: `1px solid ${theme.palette.primary.main}`,
    background: `${theme.palette.primary.main}22`,
  },
  [`& .${classes.addBtn}`]: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '12px',
    border: `1px solid ${theme.palette.divider}`,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: theme.palette.text.secondary,
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  [`& .${classes.quickPicker}`]: {
    position: 'absolute',
    bottom: '100%',
    display: 'flex',
    gap: '4px',
    padding: '8px',
    borderRadius: '8px',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[4],
    zIndex: 1000,
  },
  [`& .${classes.hiddenPicker}`]: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    display: 'flex',
    gap: '4px',
    padding: '8px',
    borderRadius: '8px',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[4],
    zIndex: 1000,
  },
  [`& .${classes.quickEmoji}`]: {
    fontSize: '20px',
    padding: '4px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  [`& .${classes.picker}`]: {
    position: 'fixed',
    bottom: 60,
    right: 15,
    zIndex: 1000,
  },
}))

interface Props {
  messageId: string
  hovered: boolean
}

export const MessageReactionBar: React.FC<Props> = ({ messageId, hovered }) => {
  const dispatch = useDispatch()
  const [quickPickerOpen, setQuickPickerOpen] = useState(false)
  const [fullPickerOpen, setFullPickerOpen] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [pickerAlign, setPickerAlign] = useState<'left' | 'right'>('left')
  const addBtnRef = useRef<HTMLDivElement>(null)
  const groups = useSelector(reactions.selectors.selectReactionsForMessage(messageId))
  const channelId = useSelector(publicChannels.selectors.currentChannelId)
  const theme = useTheme()

  useEffect(() => {
    if (!hovered) {
      setShowHidden(false)
    }
  }, [hovered])

  const react = (emoji: string) => {
    if (!channelId) return
    dispatch(reactions.actions.sendReaction({ targetMessageId: messageId, emoji, channelId }))
    setQuickPickerOpen(false)
    setFullPickerOpen(false)
    setShowHidden(false)
  }

  const closeAll = () => {
    setQuickPickerOpen(false)
    setFullPickerOpen(false)
  }

  const handleOpenQuickPicker = () => {
    if (addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect()
      const spaceOnRight = window.innerWidth - rect.left
      setPickerAlign(spaceOnRight < 300 ? 'right' : 'left')
    }
    setQuickPickerOpen(v => !v)
  }

  const MAX_VISIBLE_REACTIONS = 5
  const visibleGroups = groups.slice(0, MAX_VISIBLE_REACTIONS)
  const hiddenGroups = groups.slice(MAX_VISIBLE_REACTIONS)

  const showAddButton = hovered || groups.length > 0

  return (
    <StyledGrid>
      <div className={classes.bar}>
        {visibleGroups.map(group => (
          <Tooltip key={group.emoji} title={group.nicknames.join(', ')}>
            <button
              className={`${classes.pill} ${group.reacted ? classes.pillActive : ''}`}
              onClick={() => react(group.emoji)}
            >
              {group.emoji} {group.count}
            </button>
          </Tooltip>
        ))}
        {hiddenGroups.length > 0 && !showHidden && (
          <button className={classes.pill} onClick={() => setShowHidden(true)}>
            +{hiddenGroups.length}
          </button>
        )}
        {showHidden &&
          hiddenGroups.map(group => (
            <Tooltip key={group.emoji} title={group.nicknames.join(', ')}>
              <button
                className={`${classes.pill} ${group.reacted ? classes.pillActive : ''}`}
                onClick={() => react(group.emoji)}
              >
                {group.emoji} {group.count}
              </button>
            </Tooltip>
          ))}
        {showAddButton && (
          <ClickAwayListener onClickAway={closeAll}>
            <div style={{ position: 'relative' }} ref={addBtnRef}>
              <Tooltip title='Add reaction'>
                <button className={classes.addBtn} onClick={handleOpenQuickPicker}>
                  <img src={emojiGray} style={{ width: 16, height: 16 }} />
                </button>
              </Tooltip>
              {quickPickerOpen && (
                <div className={classes.quickPicker} style={pickerAlign === 'right' ? { right: 0 } : { left: 0 }}>
                  {QUICK_REACTIONS.map(emoji => (
                    <button key={emoji} className={classes.quickEmoji} onClick={() => react(emoji)}>
                      {emoji}
                    </button>
                  ))}
                  <Tooltip title='More reactions'>
                    <button
                      className={classes.quickEmoji}
                      onClick={() => {
                        setQuickPickerOpen(false)
                        setFullPickerOpen(true)
                      }}
                    >
                      <img src={emojiGray} style={{ width: 20, height: 20 }} />
                    </button>
                  </Tooltip>
                </div>
              )}
              {fullPickerOpen && (
                <div className={classes.picker}>
                  <Picker
                    onEmojiClick={emojiData => react(emojiData.emoji)}
                    emojiStyle={EmojiStyle.NATIVE}
                    theme={theme.palette.mode as Theme}
                  />
                </div>
              )}
            </div>
          </ClickAwayListener>
        )}
      </div>
    </StyledGrid>
  )
}

export default MessageReactionBar
