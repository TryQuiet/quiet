import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select, put } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { type identityActions } from '../identity.slice'
import {
  type RegisterOwnerCertificatePayload,
  type RegisterUserCertificatePayload,
  SocketActionTypes,
} from '@quiet/types'
import { communitiesActions } from '../../communities/communities.slice'

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
        privKey: currentCommunity.CA.rootKeyString,
      },
    }

    yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload))
  }

  yield* put(communitiesActions.launchCommunity(action.payload.communityId))

  // else {
  //   if (!currentCommunity.registrarUrl) {
  //     console.error('Could not register certificate, no registrar url')
  //     return
  //   }
  //   const payload: RegisterUserCertificatePayload = {
  //     communityId: action.payload.communityId,
  //     userCsr: action.payload.userCsr.userCsr,
  //     serviceAddress: currentCommunity.registrarUrl,
  //   }

  //   yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.REGISTER_USER_CERTIFICATE, payload))
  // }
}
