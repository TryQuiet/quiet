import React from 'react'
import { styled, useTheme } from '@mui/material/styles'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { getEmojiFromShortcode } from './utils/emojiCodes'
import { rowHover } from '../../../../design-system/theme/components'

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
    // 'Overlay menu' (library 5578:43731): radius 16, shadow theme.shadows[6]; rows are 'Search result' (3799:12467).
    background: theme.palette.background.default,
    borderRadius: 16,
    boxShadow: theme.shadows[6],
    overflowY: 'auto',
    zIndex: 9999999,
    border: `1px solid ${theme.palette.colors.border01}`,
    padding: '0px',
    fontFamily: "'Rubik', sans-serif",
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
      background: rowHover(theme),
    },
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.colors.border01}`,
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
    background: theme.palette.colors.linkBlue,
    color: theme.palette.colors.white,
    '& span:first-of-type': {
      color: theme.palette.colors.white,
    },
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

  // Calculate adjusted position to prevent overflow
  const adjustPosition = () => {
    // Default to provided position
    const adjustedPosition = { ...position }

    // If we're in browser environment, check bounds
    if (typeof window !== 'undefined') {
      // Get viewport width
      const viewportWidth = window.innerWidth

      // Calculate right edge of dropdown
      const rightEdge = position.left + position.width

      // If dropdown would overflow right edge of viewport
      if (rightEdge > viewportWidth) {
        // Adjust left position to keep it within viewport
        adjustedPosition.left = Math.max(0, viewportWidth - position.width)
      }
    }

    return adjustedPosition
  }

  const adjustedPosition = adjustPosition()

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <StyledRoot
        ref={dropdownRef}
        className={classes.emojiDropdown}
        data-testid='emoji-dropdown'
        style={{
          position: 'fixed',
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          width: `${adjustedPosition.width}px`,
          maxWidth: '100vw', // Prevent horizontal overflow
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
            <span>{getEmojiFromShortcode(suggestion)}</span>
          </div>
        ))}
      </StyledRoot>
    </ClickAwayListener>
  )
}

export default EmojiDropdown
