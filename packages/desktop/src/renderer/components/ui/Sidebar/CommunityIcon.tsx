import React from 'react'
import { styled } from '@mui/material/styles'
import { sidebarMetrics } from './sidebarMetrics'

const PREFIX = 'CommunityIcon'

const classes = {
  root: `${PREFIX}root`,
}

/**
 * `Community icon top-level` (`5196:15387`, Small=True) draws the community's
 * initial on a pale lilac tile. Neither colour is in the app's palette yet, so
 * both are the library's own values rather than an approximation from
 * `theme.palette.colors`.
 */
const BACKGROUND = '#F9F0FF'
const LETTER = '#9C00FF'

const StyledIcon = styled('span')(() => ({
  [`&.${classes.root}`]: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    width: sidebarMetrics.header.communityIcon,
    height: sidebarMetrics.header.communityIcon,
    borderRadius: sidebarMetrics.header.communityIconRadius,
    backgroundColor: BACKGROUND,
    color: LETTER,
    // The library sets 21px on a 28px tile, off the type scale because it is a
    // drawn mark rather than text. Line-height matches the tile so it centres.
    fontSize: 21,
    lineHeight: `${sidebarMetrics.header.communityIcon}px`,
    fontWeight: 400,
    userSelect: 'none',
    overflow: 'hidden',
  },
}))

export interface CommunityIconProps {
  name: string
  className?: string
  'data-testid'?: string
}

/** The community's initial, shown beside its name at the top of the sidebar. */
export const CommunityIcon: React.FC<CommunityIconProps> = ({ name, className, 'data-testid': testId }) => {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? ''
  return (
    <StyledIcon className={[classes.root, className ?? ''].filter(Boolean).join(' ')} data-testid={testId} aria-hidden>
      {initial}
    </StyledIcon>
  )
}

export default CommunityIcon
