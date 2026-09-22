import React from 'react'
import { styled } from '@mui/material/styles'

import Box from '@mui/material/Box'

import ActionProgress from '../ui/ActionProgress/ActionProgress'
import { ConnectionProcessInfo } from '@quiet/types'

/**
 * Joining or creating a community hosted on a server (QSS), from the designer's
 * own desktop frame (y8h6w8PYR9jyI3zjYHL9Cl Draft 6, Frame 1320 `1430:48030`):
 * the split view with the sidebar greyed and, centred in the chat area, the bar
 * with `Creating community “Rockets”` (`I1430:48025;3816:12490`) and a second
 * line under it (`I1430:48025;3816:12495`).
 *
 * No globe, no title, and above all no Tor explanation: a community on a server
 * does not connect over Tor, so none of that copy is true of it.
 *
 * The frame draws the sidebar because it draws the app mid-creation. The app's
 * `Sidebar` renders nothing until the community and its channels exist, which
 * is most of the window this screen covers, so the sidebar is dimmed behind
 * this panel only when it is actually mounted; otherwise the panel is the
 * frame's chat area alone, filling the window.
 */

const PREFIX = 'ServerJoiningPanel'

const classes = {
  root: `${PREFIX}root`,
  scrim: `${PREFIX}scrim`,
  content: `${PREFIX}content`,
}

/** The sidebar's own width (SidebarComponent), and the frame's (1430:47916). */
export const SIDEBAR_WIDTH = 220

const StyledBox = styled(Box, { shouldForwardProp: prop => prop !== 'sidebarWidth' })<{ sidebarWidth: number }>(
  ({ theme, sidebarWidth }) => ({
    [`&.${classes.root}`]: {
      position: 'fixed',
      inset: 0,
      zIndex: theme.zIndex.modal,
      display: 'flex',
    },
    [`& .${classes.scrim}`]: {
      width: sidebarWidth,
      flex: '0 0 auto',
      // Greys the sidebar the frame draws behind this screen, without touching it.
      backgroundColor: theme.palette.action.disabledBackground,
    },
    [`& .${classes.content}`]: {
      flex: '1 1 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(4),
    },
  })
)

export interface ServerJoiningPanelProps {
  open: boolean
  connectionInfo: { number: number; text: ConnectionProcessInfo }
  isOwner: boolean
  communityName?: string
  /** Whether the app's sidebar is mounted behind this screen, so it can be dimmed. */
  withSidebar?: boolean
}

/** `Creating community “Rockets”` as the frame draws it, with the app's own name. */
export const serverStatus = (isOwner: boolean, communityName?: string): string => {
  const verb = isOwner ? 'Creating' : 'Joining'
  return communityName ? `${verb} community “${communityName}”` : `${verb} community`
}

export const ServerJoiningPanel: React.FC<ServerJoiningPanelProps> = ({
  open,
  connectionInfo,
  isOwner,
  communityName,
  withSidebar = false,
}) => {
  if (!open) return null

  return (
    <StyledBox
      className={classes.root}
      sidebarWidth={withSidebar ? SIDEBAR_WIDTH : 0}
      data-testid={'serverJoiningPanel'}
      role='dialog'
      aria-modal='true'
    >
      {withSidebar && <div className={classes.scrim} aria-hidden />}
      <div className={classes.content} data-testid={'joiningPanelComponent'}>
        <ActionProgress
          status={serverStatus(isOwner, communityName)}
          secondary={connectionInfo.text}
          value={connectionInfo.number / 100}
          data-testid={'serverJoiningProgress'}
        />
      </div>
    </StyledBox>
  )
}

export default ServerJoiningPanel
