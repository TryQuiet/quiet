import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select, put } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../identity.slice'
import {
  type RegisterOwnerCertificatePayload,
  type RegisterUserCertificatePayload,
  SocketActionTypes,
  type InitCommunityPayload,
} from '@quiet/types'
import { communitiesActions } from '../../communities/communities.slice'

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerCertificate>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const isUsernameTaken = action.payload.isUsernameTaken
  if (!currentCommunity) {
    console.error('Could not register certificate, no current community')
    return
  }

  if (currentCommunity.CA?.rootCertString) {
    const identity = yield* select(identitySelectors.selectById(currentCommunity.id))
    if (!identity?.userCsr || !currentCommunity?.rootCa) {
      console.error("User CSR or root cert missing", identity?.userCsr, currentCommunity?.rootCa)
      return
    }

    const payload: InitCommunityPayload = {
      id: currentCommunity.id,
      peerId: identity.peerId,
      hiddenService: identity.hiddenService,
      certs: {
        // Hacking, perhaps make certs.certificate optional
        certificate: identity.userCertificate || '',
        key: identity.userCsr.userKey,
        CA: [currentCommunity.rootCa],
      },
      ownerCsr: identity.userCsr,
      permsData: {
        certificate: currentCommunity.CA.rootCertString,
        privKey: currentCommunity.CA.rootKeyString,
      },
    }

    yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.CREATE_COMMUNITY, payload))
  } else {
    if (!isUsernameTaken) {
      yield* put(communitiesActions.launchCommunity(action.payload.communityId))
    } else {
      yield* put(identityActions.saveUserCsr())
    }
  }
}
