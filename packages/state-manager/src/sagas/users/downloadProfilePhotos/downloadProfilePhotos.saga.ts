import { applyEmitParams, type Socket } from '../../../types'
import { select, apply, put } from 'typed-redux-saga'
import type { PayloadAction } from '@reduxjs/toolkit'
import { identitySelectors } from '../../identity/identity.selectors'
import { usersActions } from '../users.slice'
import { userProfileSelectors } from '../userProfile/userProfile.selectors'
import { filesActions } from '../../files/files.slice'
import { filesSelectors } from '../../files/files.selectors'
import { settingsSelectors } from '../../settings/settings.selectors'
import { DownloadState, SocketActions, UserProfile } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('downloadProfilePhotosSaga')

/**
 * Checks all user profiles and downloads missing profile photos
 * Uses the existing IPFS file download infrastructure
 */
export function* downloadProfilePhotosSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof usersActions.downloadProfilePhotos>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    logger.warn('No identity found, cannot download profile photos')
    return
  }

  const allProfiles = yield* select(userProfileSelectors.userProfiles)
  const downloadStatuses = yield* select(filesSelectors.downloadStatuses)
  const maxAutodownloadSizeBytes = yield* select(settingsSelectors.maxAutodownloadBytes)

  logger.info('Checking for missing profile photos')

  for (const userId in allProfiles) {
    const profile = allProfiles[userId] as UserProfile | undefined
    if (!profile) continue

    // Skip if profile doesn't have IPFS photo
    if (!profile.photoFile || !profile.photoFile.cid) continue

    // Skip if photo hasn't been uploaded to IPFS yet (empty CID)
    if (profile.photoFile.cid === '') continue

    const photoMetadata = profile.photoFile
    const messageId = photoMetadata.message.id

    // Check current download status
    const downloadStatus = downloadStatuses[messageId]

    // Skip if already downloaded or downloading
    if (
      downloadStatus?.downloadState === DownloadState.Completed ||
      downloadStatus?.downloadState === DownloadState.Downloading ||
      downloadStatus?.downloadState === DownloadState.Queued
    ) {
      continue
    }

    // Skip if canceled by user
    if (downloadStatus?.downloadState === DownloadState.Canceled) {
      continue
    }

    // Skip if marked as malicious
    if (downloadStatus?.downloadState === DownloadState.Malicious) {
      continue
    }

    // Check file size - profile photos should respect auto-download limits
    const photoSize = photoMetadata.size || 0
    if (photoSize > maxAutodownloadSizeBytes) {
      logger.info(
        `Profile photo for ${userId} (${(photoSize / 1024).toFixed(1)}KB) exceeds auto-download limit, skipping`
      )
      continue
    }

    logger.info(`Queuing profile photo download for user ${userId} (CID: ${photoMetadata.cid})`)

    // Update download status to queued
    yield* put(
      filesActions.updateDownloadStatus({
        mid: messageId,
        cid: photoMetadata.cid,
        downloadState: DownloadState.Queued,
      })
    )

    // Trigger download using existing IPFS infrastructure
    yield* apply(
      socket,
      socket.emit,
      applyEmitParams(SocketActions.DOWNLOAD_FILE, {
        peerId: identity.networkInfo.peerId.id,
        metadata: photoMetadata,
      })
    )
  }
}
