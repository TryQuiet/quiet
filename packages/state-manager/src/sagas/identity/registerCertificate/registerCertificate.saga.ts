import { apply, select } from 'typed-redux-saga'
import { applyEmitParams, type Socket } from '../../../types'
import { RegisterOwnerCertificatePayload } from '../identity.types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { SocketActionTypes } from '@quiet/types'

export function* registerCertificateSaga(
  socket: Socket,
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const currentIdentity = yield* select(identitySelectors.currentIdentity)
  
  if (!currentCommunity || !currentIdentity || !currentIdentity.userCsr?.userCsr) {
    console.error('Could not register owners\' certificate, missing structures in redux.', currentIdentity)
    return
  }

  // Register owner certificate
  if (currentCommunity.CA?.rootCertString) {
    const payload: RegisterOwnerCertificatePayload = {
      communityId: currentCommunity.id,
      userCsr: currentIdentity.userCsr,
      permsData: {
        certificate: currentCommunity.CA.rootCertString,
        privKey: currentCommunity.CA.rootKeyString,
      },
    }

    console.log('emitting register owner certificate')
    yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload))
  }
}
