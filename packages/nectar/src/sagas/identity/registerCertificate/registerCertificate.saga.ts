import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identityActions, RegisterOwnerCertificatePayload, RegisterUserCertificatePayload } from '../identity.slice'

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.storeUserCsr>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  if (currentCommunity.CA?.rootCertString) {
    const payload: RegisterOwnerCertificatePayload = {
      id: action.payload.communityId,
      userCsr: action.payload.userCsr.userCsr,
      permsData: {
        certificate: currentCommunity.CA.rootCertString,
        privKey: currentCommunity.CA.rootKeyString
      }
    }
    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      payload
    ])
  } else {
    const registrarUrl = action.payload.registrarAddress.includes(':')
      ? `http://${action.payload.registrarAddress}`
      : `http://${action.payload.registrarAddress}.onion`
    const payload: RegisterUserCertificatePayload = {
      id: action.payload.communityId,
      userCsr: action.payload.userCsr.userCsr,
      serviceAddress: registrarUrl
    }
    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_USER_CERTIFICATE,
      payload
    ])
  }
}
