import { Socket } from 'socket.io-client'
import { select, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { missingChannelFiles } from '../../messages/messages.selectors'
import { SocketActionTypes } from '../../socket/const/actionTypes'

export function* checkForMissingFilesSaga(socket: Socket): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const channels = yield* select(publicChannelsSelectors.publicChannels)

  for (const channel of channels) {
    const missingFiles = yield* select(missingChannelFiles(channel.address))
    if (missingFiles.length > 0) {
      for (const file of missingFiles) {
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
