import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Tooltip from '../Tooltip/Tooltip'
import { PlusCircleIcon } from './sidebarIcons'
import { sidebarMetrics } from './sidebarMetrics'

const PREFIX = 'SidebarHeader'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  action: `${PREFIX}action`,
}

const StyledHeader = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: sidebarMetrics.title.height,
    padding: `${sidebarMetrics.title.paddingY}px ${sidebarMetrics.title.paddingX}px`,
    gap: sidebarMetrics.title.gap,
  },

  [`& .${classes.title}`]: {
    opacity: sidebarMetrics.opacity.label,
    color: theme.palette.colors.white,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  [`& .${classes.action}`]: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sidebarMetrics.title.action,
    height: sidebarMetrics.title.action,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: theme.palette.colors.white,
    opacity: sidebarMetrics.opacity.titleAction,
    '&:hover': {
      opacity: sidebarMetrics.opacity.hover,
    },
  },
}))

export interface SidebarHeaderProps {
  title: string
  /** Omitted when the user may not add to this section: the (+) then goes away. */
  action?: () => void
  tooltipText: string
  actionTestId?: string
}

/**
 * `List title` from the Quiet Design Library: a section header on the sidebar's
 * purple column, with the section's (+) at its right edge.
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  action,
  tooltipText,
  actionTestId = 'addChannelButton',
}) => {
  return (
    <StyledHeader className={classes.root}>
      <Typography variant='subtitle2' className={classes.title}>
        {title}
      </Typography>
      {typeof action === 'function' && (
        <Tooltip title={tooltipText} placement='bottom'>
          <button
            type='button'
            className={classes.action}
            aria-label={tooltipText}
            onClick={event => {
              event.persist()
              action()
            }}
            data-testid={actionTestId}
          >
            <PlusCircleIcon />
          </button>
        </Tooltip>
      )}
    </StyledHeader>
  )
}

export default SidebarHeader
