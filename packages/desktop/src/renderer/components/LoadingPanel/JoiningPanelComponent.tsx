import React from 'react'

import { ConnectionProcessInfo } from '@quiet/types'
import { createLogger } from '../../logger'

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
}) => {
  logger.info('Generating JoiningPanelComponent with props:', { open, connectionInfo, isOwner, usesServer })

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
