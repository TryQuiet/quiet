import React from 'react'
import { styled, useTheme } from '@mui/material/styles'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { emojiShortcodes } from './utils/emojiCodes'

const PREFIX = 'EmojiDropdown'

const classes = {
  emojiDropdown: `${PREFIX}__emojiDropdown`,
  emojiDropdownItem: `${PREFIX}__emojiDropdownItem`,
  selectedItem: `${PREFIX}__selectedItem`,
}

const StyledRoot = styled('div')(({ theme }) => ({
  [`&.${classes.emojiDropdown}`]: {
    maxHeight: '200px',
    width: '100%',
    background: theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffffff',
    borderRadius: 16,
    boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.3)',
    overflowY: 'auto',
    zIndex: 9999999,
    border: theme.palette.mode === 'dark' ? '1px solid #333333' : '1px solid #E5E5E5',
    padding: '0px',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    },
  },
  [`& .${classes.emojiDropdownItem}`]: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      background: theme.palette.mode === 'dark' ? 'rgba(50, 100, 255, 0.15)' : 'rgba(50, 100, 255, 0.08)',
    },
    '&:not(:last-child)': {
      borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
    },
    '& span:first-of-type': {
      marginRight: 12,
      color: theme.palette.text.primary,
      flex: 2,
      fontSize: 14,
      fontWeight: 400,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& span:last-of-type': {
      fontSize: 20,
      marginLeft: 8,
      flex: 0,
      minWidth: '32px',
      textAlign: 'center',
    },
  },
  [`& .${classes.selectedItem}`]: {
    background: theme.palette.mode === 'dark' ? 'rgba(50, 100, 255, 0.15)' : 'rgba(50, 100, 255, 0.1)',
    fontWeight: 400,
    position: 'relative',
  },
}))

export interface EmojiDropdownProps {
  suggestions: string[]
  selectedIndex: number
  position: { top: number; left: number; width: number }
  onClickAway: () => void
  onEmojiSelect: (shortcode: string) => void
}

const MAX_EMOJI_SUGGESTIONS = 100

export const EmojiDropdown: React.FC<EmojiDropdownProps> = ({
  suggestions,
  selectedIndex,
  position,
  onClickAway,
  onEmojiSelect,
}) => {
  const theme = useTheme()
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Effect to scroll the selected item into view when selectedIndex changes
  React.useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const container = dropdownRef.current
      const selectedElement = container.querySelector(`.${classes.selectedItem}`) as HTMLElement

      if (selectedElement) {
        // Get the positions of the container and selected element
        const containerRect = container.getBoundingClientRect()
        const selectedRect = selectedElement.getBoundingClientRect()

        // Check if the selected element is outside of the visible area
        const isAbove = selectedRect.top < containerRect.top
        const isBelow = selectedRect.bottom > containerRect.bottom

        if (isAbove) {
          // Scroll the element into view at the top
          selectedElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
        } else if (isBelow) {
          // Scroll the element into view at the bottom
          selectedElement.scrollIntoView({ block: 'end', behavior: 'smooth' })
        }
      }
    }
  }, [selectedIndex])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <StyledRoot
        ref={dropdownRef}
        className={classes.emojiDropdown}
        data-testid='emoji-dropdown'
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          zIndex: 9999999,
        }}
      >
        {suggestions.slice(0, MAX_EMOJI_SUGGESTIONS).map((suggestion, index) => (
          <div
            key={index}
            className={`${classes.emojiDropdownItem} ${index === selectedIndex ? classes.selectedItem : ''}`}
            onClick={() => onEmojiSelect(suggestion)}
          >
            <span>{suggestion}</span>
            <span>{emojiShortcodes[suggestion]}</span>
          </div>
        ))}
      </StyledRoot>
    </ClickAwayListener>
  )
}

export default EmojiDropdown
