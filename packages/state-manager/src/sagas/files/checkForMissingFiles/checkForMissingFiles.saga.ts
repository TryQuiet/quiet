import { Socket } from 'socket.io-client'
import { select, apply, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { connectionActions } from '../../appConnection/connection.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { missingChannelFiles } from '../../messages/messages.selectors'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { filesActions } from '../files.slice'
import { DownloadState } from '../files.types'
import { AUTODOWNLOAD_SIZE_LIMIT} from '../../../constants'
import { filesSelectors } from '../files.selectors'

export function* checkForMissingFilesSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof connectionActions.addInitializedCommunity>['payload']>
): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)

  if (community.id !== action.payload) return

  const identity = yield* select(identitySelectors.currentIdentity)

  const channels = yield* select(publicChannelsSelectors.publicChannels)

  const fileStatuses = yield* select(filesSelectors.downloadStatuses)

  for (const channel of channels) {
    const missingFiles = yield* select(missingChannelFiles(channel.address))
    if (missingFiles.length > 0) {
      for (const file of missingFiles) {
        if(file.size > AUTODOWNLOAD_SIZE_LIMIT || fileStatuses[file.message.id].downloadState === DownloadState.Canceled) return

        yield* put(filesActions.updateDownloadStatus({
          mid: file.message.id,
          cid: file.cid,
          downloadState: DownloadState.Queued
        }))

        yield* apply(socket, socket.emit, [
          SocketActionTypes.DOWNLOAD_FILE,
          {
            peerId: identity.peerId.id,
            metadata: file
          }
        ])
      }
    }
  }
}
