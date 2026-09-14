import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { sidebarMetrics } from './sidebarMetrics'

const PREFIX = 'SidebarUnreadBadge'

const classes = {
  root: `${PREFIX}root`,
  dot: `${PREFIX}dot`,
}

const StyledBadge = styled('span')(({ theme }) => ({
  [`&.${classes.root}`]: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: sidebarMetrics.badge.size,
    height: sidebarMetrics.badge.size,
    padding: '2px 4px',
    boxSizing: 'border-box',
    borderRadius: sidebarMetrics.badge.radius,
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.colors.white,
  },

  [`&.${classes.dot}`]: {
    minWidth: sidebarMetrics.badge.dot,
    width: sidebarMetrics.badge.dot,
    height: sidebarMetrics.badge.dot,
    padding: 0,
  },
}))

export interface SidebarUnreadBadgeProps {
  /**
   * Number of unread messages. Quiet tracks unread per channel as a boolean
   * (`PublicChannelStatus.unread`), so there is no count to show and callers
   * leave this out: the badge then renders as the library pill collapsed to a
   * dot rather than showing a made-up number.
   */
  count?: number
  className?: string
  'data-testid'?: string
}

/**
 * `badge2` from the Quiet Design Library — the unread marker at a row's right
 * edge.
 */
export const SidebarUnreadBadge: React.FC<SidebarUnreadBadgeProps> = ({ count, className, 'data-testid': testId }) => {
  const isDot = count === undefined
  return (
    <StyledBadge
      className={[classes.root, isDot ? classes.dot : '', className ?? ''].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      {!isDot && (
        <Typography variant='caption' component='span' style={{ lineHeight: '12px', color: 'inherit' }}>
          {count}
        </Typography>
      )}
    </StyledBadge>
  )
}

export default SidebarUnreadBadge
