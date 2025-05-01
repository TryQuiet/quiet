import { applyEmitParams, type Socket } from '../../../types'
import { select, apply, put, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { missingChannelFiles } from '../../messages/messages.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { filesActions } from '../files.slice'
import { AUTODOWNLOAD_SIZE_LIMIT } from '../../../constants'
import { filesSelectors } from '../files.selectors'
import { type networkActions } from '../../network/network.slice'
import { DownloadState, Identity, SocketActions } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { networkSelectors } from '../../network/network.selectors'
import { connectionSelectors } from '../../appConnection/connection.selectors'

const logger = createLogger('checkForMissingFilesSaga')

export function* checkForMissingFilesSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.checkForMissingFiles>['payload']>
): Generator {
  let identity: ReturnType<typeof identitySelectors.currentIdentity> | null = null
  let channels: ReturnType<typeof publicChannelsSelectors.publicChannels> | null = null
  let isTorInitialized: ReturnType<typeof connectionSelectors.isTorInitialized> | null = null
  let community: ReturnType<typeof communitiesSelectors.currentCommunity> | null = null
  while (true) {
    community = yield* select(communitiesSelectors.currentCommunity)
    if (community && community?.id !== action.payload) {
      logger.warn(
        `Tried to check for missing files, but the community ${action.payload} is not the current community ${community?.id}`
      )
      return
    }

    identity = yield* select(identitySelectors.currentIdentity)
    channels = yield* select(publicChannelsSelectors.publicChannels)
    isTorInitialized = yield* select(connectionSelectors.isTorInitialized)

    if (identity && channels && isTorInitialized) {
      break // All conditions are met, exit the loop
    }

    logger.warn('Waiting for all conditions to be met...')
    yield* take('*') // Wait for any action to be dispatched
  }

  const downloadStatuses = yield* select(filesSelectors.downloadStatuses)

  for (const channel of channels) {
    const missingFiles = yield* select(missingChannelFiles(channel.id))
    logger.info(`Detected ${missingFiles.length} missing files in channel ${channel.id}`)

    if (missingFiles.length > 0) {
      for (const file of missingFiles) {
        logger.info(`Checking file ${file.cid} in channel ${channel.id}`)
        const fileDownloadStatus = downloadStatuses[file.message.id]
        // Do not autodownload canceled files
        if (fileDownloadStatus?.downloadState === DownloadState.Canceled) continue
        // Start downloading already queued files
        if (fileDownloadStatus?.downloadState === DownloadState.Queued) {
          logger.info(`Resuming download for file ${file.cid} in channel ${channel.id}`)
          yield* apply(
            socket,
            socket.emit,
            applyEmitParams(SocketActions.DOWNLOAD_FILE, {
              peerId: identity.networkInfo.peerId.id,
              metadata: file,
            })
          )
          continue
        }

        // Do not autodownload oversized files unless started manually
        const fileSize = file.size || 0
        if (fileDownloadStatus?.downloadState !== DownloadState.Downloading && fileSize > AUTODOWNLOAD_SIZE_LIMIT) {
          continue
        }

        // Do not autodownload if the file was reported malicious or is missing reported file size
        if (fileDownloadStatus?.downloadState === DownloadState.Malicious) continue

        yield* put(
          filesActions.updateDownloadStatus({
            mid: file.message.id,
            cid: file.cid,
            downloadState: DownloadState.Queued,
          })
        )

        yield* apply(
          socket,
          socket.emit,
          applyEmitParams(SocketActions.DOWNLOAD_FILE, {
            peerId: identity.networkInfo.peerId.id,
            metadata: file,
          })
        )
      }
    }
  }
}
