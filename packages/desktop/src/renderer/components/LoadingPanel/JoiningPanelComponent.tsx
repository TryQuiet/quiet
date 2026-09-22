import React from 'react'

import { ConnectionProcessInfo } from '@quiet/types'
import { createLogger } from '../../logger'

import ResetFailedPanel from './ResetFailedPanel'
import TorJoiningPanel from './TorJoiningPanel'
import ServerJoiningPanel from './ServerJoiningPanel'

const logger = createLogger('JoiningPanelComponent')

/**
 * Progress while joining or creating, which is two screens, not one (decided
 * 2026-09-13):
 *
 * - over **Tor**, the explanatory screen — `Joining now` (Quiet Design Library
 *   5978:19161) with `Connecting via Tor` under the bar (1316:34596);
 * - on a **server** (QSS), the simple one — the designer's desktop frame
 *   `1430:48030`, a bar and a status line and nothing else.
 *
 * The Tor explanation is about Tor. Showing it to someone joining a community
 * on a server describes a connection they are not making.
 */

export interface JoiningPanelComponentProps {
  open: boolean
  handleClose: () => void
  openUrl: (url: string) => void
  connectionInfo: { number: number; text: ConnectionProcessInfo }
  isOwner: boolean
  /** Whether this community is hosted on a server (QSS) rather than reached over Tor alone. */
  usesServer?: boolean
  communityName?: string
  withSidebar?: boolean
  resetFailed?: boolean
  resetFailureMessage?: string
  onRetryReset?: () => void
}

const JoiningPanelComponent: React.FC<JoiningPanelComponentProps> = ({
  open,
  handleClose,
  openUrl,
  connectionInfo,
  isOwner,
  usesServer = false,
  communityName,
  withSidebar = false,
  resetFailed = false,
  resetFailureMessage = 'Quiet could not safely clear the incomplete community. Check your connection and try again.',
  onRetryReset,
}) => {
  logger.info('Generating JoiningPanelComponent with props:', { open, connectionInfo, isOwner, usesServer })

  // Clearing a failed admission did not work: there is no progress to draw, on
  // either transport, so this state replaces both screens rather than sitting
  // inside them.
  if (resetFailed) {
    return (
      <ResetFailedPanel open={open} handleClose={handleClose} message={resetFailureMessage} onRetry={onRetryReset} />
    )
  }

  if (usesServer) {
    return (
      <ServerJoiningPanel
        open={open}
        connectionInfo={connectionInfo}
        isOwner={isOwner}
        communityName={communityName}
        withSidebar={withSidebar}
      />
    )
  }

  return (
    <TorJoiningPanel
      open={open}
      handleClose={handleClose}
      openUrl={openUrl}
      connectionInfo={connectionInfo}
      isOwner={isOwner}
    />
  )
}

export default JoiningPanelComponent
