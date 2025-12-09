import { apply, put, select } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { settingsSelectors } from '../../settings/settings.selectors'
import { filesActions } from '../files.slice'
import { filesSelectors } from '../files.selectors'
import { applyEmitParams, type Socket } from '../../../types'
import { DownloadState, MessageType, SocketActions } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('recheckAutoDownloadThresholdSaga')

export function* recheckAutoDownloadThresholdSaga(socket: Socket): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    logger.error('Could not recheck auto-download threshold, no identity')
    return
  }

  const downloadStatuses = yield* select(filesSelectors.downloadStatuses)
  const maxAutodownloadSizeBytes = yield* select(settingsSelectors.maxAutodownloadBytes)

  const readyMessageIds = Object.keys(downloadStatuses).filter(
    mid => downloadStatuses[mid]?.downloadState === DownloadState.Ready
  )

  if (readyMessageIds.length === 0) {
    return
  }

  const messages = yield* select(messagesSelectors.messagesByIds(readyMessageIds))
  for (const message of messages) {
    if (!message.media || (message.type !== MessageType.Image && message.type !== MessageType.File)) {
      continue
    }

    if (message.media.path) continue

    const messageMediaSize = message.media.size || 0
    if (messageMediaSize > maxAutodownloadSizeBytes) {
      continue
    }

    logger.info(`Re-queuing download for file ${message.media.cid} in message ${message.id} due to threshold change`)

    yield* put(
      filesActions.updateDownloadStatus({
        mid: message.id,
        cid: message.media.cid,
        downloadState: DownloadState.Queued,
      })
    )

    yield* apply(
      socket,
      socket.emit,
      applyEmitParams(SocketActions.DOWNLOAD_FILE, {
        peerId: identity.networkInfo.peerId.id,
        metadata: message.media,
      })
    )
  }
}
