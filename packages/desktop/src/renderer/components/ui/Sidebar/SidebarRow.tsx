import React from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import ListItemButton from '@mui/material/ListItemButton'
import Typography from '@mui/material/Typography'
import { sidebarMetrics } from './sidebarMetrics'

const PREFIX = 'SidebarRow'

const classes = {
  root: `${PREFIX}root`,
  people: `${PREFIX}people`,
  selected: `${PREFIX}selected`,
  disabled: `${PREFIX}disabled`,
  glyph: `${PREFIX}glyph`,
  labelGroup: `${PREFIX}labelGroup`,
  label: `${PREFIX}label`,
  labelInGroup: `${PREFIX}labelInGroup`,
  unread: `${PREFIX}unread`,
}

const StyledRow = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: sidebarMetrics.row.height,
    padding: `${sidebarMetrics.row.paddingY}px ${sidebarMetrics.row.paddingX}px`,
    gap: sidebarMetrics.row.gap,
    display: 'flex',
    alignItems: 'center',
    // State=Default paints no overlay at all.
    backgroundColor: 'transparent',
    color: theme.palette.colors.white,
    borderRadius: 0,
  },

  [`&.${classes.people}`]: {
    minHeight: sidebarMetrics.peopleRow.height,
    padding: `${sidebarMetrics.peopleRow.paddingY}px ${sidebarMetrics.peopleRow.paddingX}px`,
    gap: sidebarMetrics.peopleRow.gap,
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: sidebarMetrics.overlay.hover,
  },

  [`&.${classes.selected}, &.${classes.selected}:hover`]: {
    backgroundColor: sidebarMetrics.overlay.selected,
  },

  // "Tapped state for all clickable stuff", from the designer's V1 note
  // (`6222:13638`). The library has no Pressed variant, so pressing reuses the
  // Selected overlay rather than introducing a third value.
  [`&.${classes.root}:active`]: {
    backgroundColor: sidebarMetrics.overlay.pressed,
  },

  [`&.${classes.disabled}`]: {
    opacity: sidebarMetrics.opacity.disabled,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },

  // The library draws every row glyph in a 12px box at 50%, so the text's
  // baseline is the same whether the row starts with # or a lock.
  [`& .${classes.glyph}`]: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sidebarMetrics.row.glyph,
    height: sidebarMetrics.row.glyph,
    opacity: sidebarMetrics.opacity.glyph,
  },

  [`& .${classes.label}`]: {
    flex: 1,
    minWidth: 0,
    opacity: sidebarMetrics.opacity.label,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.colors.white,
  },

  // An annotated row (a DM with yourself says "you" after the name) keeps the
  // annotation next to the name rather than at the column's right edge, which
  // is where the unread badge lives. The label then sizes to its text and the
  // group does the flexing, so a long name still truncates before the
  // annotation rather than pushing it out of the row.
  [`& .${classes.labelGroup}`]: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },

  [`& .${classes.labelInGroup}`]: {
    flex: '0 1 auto',
  },

  // Quiet has no unread counts, so the badge alone cannot say how much is
  // unread and cannot be read without colour. The label carries the state too.
  [`& .${classes.unread}`]: {
    opacity: sidebarMetrics.opacity.hover,
    fontWeight: 500,
  },
}))

export interface SidebarRowProps {
  label: string
  /** A 12px library glyph for an item row, or a 24px avatar for a people row. */
  glyph?: React.ReactNode
  /** Rendered at the row's right edge — normally a `SidebarUnreadBadge`. */
  badge?: React.ReactNode
  /** Rendered beside the label rather than at the right edge — e.g. a DM row's "you". */
  annotation?: React.ReactNode
  /** `List item` (26px) or `List item--people` (30px). */
  variant?: 'item' | 'people'
  selected?: boolean
  unread?: boolean
  disabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  className?: string
  tabIndex?: number
  'data-testid'?: string
  labelTestId?: string
}

/**
 * `List item` / `List item--people` from the Quiet Design Library: one 220px-wide
 * sidebar row, whose hover and selected fills span the full column width.
 */
export const SidebarRow: React.FC<SidebarRowProps> = ({
  label,
  glyph,
  badge,
  annotation,
  variant = 'item',
  selected = false,
  unread = false,
  disabled = false,
  onClick,
  className,
  tabIndex,
  'data-testid': testId,
  labelTestId,
}) => {
  return (
    <StyledRow
      disableGutters
      disableRipple
      onClick={onClick}
      tabIndex={tabIndex}
      className={classNames(
        classes.root,
        {
          [classes.people]: variant === 'people',
          [classes.selected]: selected,
          [classes.disabled]: disabled,
        },
        className
      )}
      data-testid={testId}
    >
      {glyph !== undefined && <span className={variant === 'people' ? undefined : classes.glyph}>{glyph}</span>}
      {annotation === undefined ? (
        <Typography
          variant='body2'
          className={classNames(classes.label, { [classes.unread]: unread })}
          data-testid={labelTestId}
        >
          {label}
        </Typography>
      ) : (
        <span className={classes.labelGroup}>
          <Typography
            variant='body2'
            className={classNames(classes.label, classes.labelInGroup, { [classes.unread]: unread })}
            data-testid={labelTestId}
          >
            {label}
          </Typography>
          {annotation}
        </span>
      )}
      {badge}
    </StyledRow>
  )
}

export default SidebarRow
