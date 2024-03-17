import { applyEmitParams, type Socket } from '../../../types'
import { select, apply, put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { missingChannelFiles } from '../../messages/messages.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { filesActions } from '../files.slice'
import { AUTODOWNLOAD_SIZE_LIMIT } from '../../../constants'
import { filesSelectors } from '../files.selectors'
import { type networkActions } from '../../network/network.slice'
import { DownloadState, SocketActionTypes } from '@quiet/types'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.FILES, LoggerModuleName.SAGA, 'checkForMissingFiles'])

export function* checkForMissingFilesSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof networkActions.addInitializedCommunity>['payload']>
): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)

  if (community?.id !== action.payload) {
    LOGGER.warn(
      `Community ID on payload (${action.payload}) was not that same as the current community (${community?.id})`
    )
    return
  }

  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    LOGGER.warn(`No identity found, can't check for missing files`)
    return
  }

  const channels = yield* select(publicChannelsSelectors.publicChannels)

  const downloadStatuses = yield* select(filesSelectors.downloadStatuses)

  for (const channel of channels) {
    const missingFiles = yield* select(missingChannelFiles(channel.id))

    if (missingFiles.length > 0) {
      for (const file of missingFiles) {
        const fileDownloadStatus = downloadStatuses[file.message.id]
        // Do not autodownload canceled files
        if (fileDownloadStatus?.downloadState === DownloadState.Canceled) continue
        // Start downloading already queued files
        if (fileDownloadStatus?.downloadState === DownloadState.Queued) {
          yield* apply(
            socket,
            socket.emit,
            applyEmitParams(SocketActionTypes.DOWNLOAD_FILE, {
              peerId: identity.peerId.id,
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
          applyEmitParams(SocketActionTypes.DOWNLOAD_FILE, {
            peerId: identity.peerId.id,
            metadata: file,
          })
        )
      }
    }
  }
}
