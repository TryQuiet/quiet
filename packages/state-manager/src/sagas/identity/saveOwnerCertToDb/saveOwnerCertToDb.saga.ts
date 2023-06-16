import { applyEmitParams, type Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { type SaveOwnerCertificatePayload, SocketActionTypes } from '@quiet/types'

export function* saveOwnerCertToDbSaga(socket: Socket): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)

  const identity = yield* select(identitySelectors.currentIdentity)
  if (!currentCommunity?.CA || !identity?.userCertificate) return

  const payload: SaveOwnerCertificatePayload = {
    id: currentCommunity?.id,
    peerId: identity.peerId.id,
    certificate: identity.userCertificate,
    permsData: {
      certificate: currentCommunity.CA.rootCertString,
      privKey: currentCommunity.CA.rootKeyString
    }
  }
  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.SAVE_OWNER_CERTIFICATE, payload)
  )
}
