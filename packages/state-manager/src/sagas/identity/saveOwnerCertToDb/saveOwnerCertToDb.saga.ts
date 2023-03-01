import { applyEmitParams, EmitEvents, Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { SaveOwnerCertificatePayload } from '../identity.types'

export function* saveOwnerCertToDbSaga(socket: Socket): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)
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
