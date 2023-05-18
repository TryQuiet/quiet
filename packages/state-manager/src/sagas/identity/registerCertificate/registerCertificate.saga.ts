import { applyEmitParams, Socket } from '../../../types'
import { PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identityActions } from '../identity.slice'
import { RegisterOwnerCertificatePayload, RegisterUserCertificatePayload, SocketActionTypes } from '@quiet/types'

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerCertificate>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  if (!currentCommunity) {
    console.error('Could not register certificate, no current community')
    return
  }

  if (currentCommunity.CA?.rootCertString) {
    const payload: RegisterOwnerCertificatePayload = {
      communityId: action.payload.communityId,
      userCsr: action.payload.userCsr,
      permsData: {
        certificate: currentCommunity.CA.rootCertString,
        privKey: currentCommunity.CA.rootKeyString
      }
    }

    yield* apply(
      socket,
      socket.emit,
      applyEmitParams(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload)
    )
  } else {
    if (!currentCommunity.registrarUrl) {
      console.error('Could not register certificate, no registrar url')
      return
    }
    const payload: RegisterUserCertificatePayload = {
      communityId: action.payload.communityId,
      userCsr: action.payload.userCsr.userCsr,
      serviceAddress: currentCommunity.registrarUrl
    }

    yield* apply(
      socket,
      socket.emit,
      applyEmitParams(SocketActionTypes.REGISTER_USER_CERTIFICATE, payload)
    )
  }
}
