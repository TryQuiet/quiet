import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identityActions } from '../identity.slice'

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.storeUserCsr>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  if (currentCommunity.CA?.rootCertString) {
    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      action.payload.communityId,
      action.payload.userCsr.userCsr,
      {
        certificate: currentCommunity.CA?.rootCertString,
        privKey: currentCommunity.CA?.rootKeyString
      }
    ])
  } else {
    const registrarUrl = action.payload.registrarAddress.includes(':')
      ? `http://${action.payload.registrarAddress}`
      : `http://${action.payload.registrarAddress}.onion`

    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_USER_CERTIFICATE,
      registrarUrl,
      action.payload.userCsr.userCsr,
      action.payload.communityId
    ])
  }
}
