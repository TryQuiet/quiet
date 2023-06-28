import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, call, take, apply } from 'typed-redux-saga'
import { createUserCsr } from '@quiet/identity'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'
import { config } from '../../users/const/certFieldTypes'
import { Socket, applyEmitParams } from '../../../types'

import { communitiesSelectors } from '../../communities/communities.selectors'
import { CreateUserCsrPayload, RegisterCertificatePayload, SocketActionTypes, Community } from '@quiet/types'

export function* registerUsernameSaga(socket: Socket, action: PayloadAction<string>): Generator {
  // Nickname can differ between saga calls
  const nickname = action.payload

  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!community) {
    console.error('Could not register username, no community data')
    return
  }

  const networkPayload: Community = {
    id: community.id,
    name: community.name,
    registrarUrl: community.registrarUrl,
    CA: community.CA,
    rootCa: community.CA?.rootCertString,
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.CREATE_NETWORK, networkPayload))

  let identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    yield* take(identityActions.addNewIdentity)
  }

  identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    console.error('Could not register username, no identity')
    return
  }

  let userCsr = null

  // Reuse the same csr if nickname hasn't changed
  if (identity.nickname === nickname) {
    userCsr = identity.userCsr
  }

  if (userCsr === null) {
    try {
      const payload: CreateUserCsrPayload = {
        nickname,
        commonName: identity.hiddenService.onionAddress,
        peerId: identity.peerId.id,
        dmPublicKey: identity.dmKeys.publicKey,
        signAlg: config.signAlg,
        hashAlg: config.hashAlg,
      }
      console.log('user csr saga payload', payload)
      userCsr = yield* call(createUserCsr, payload)
    } catch (e) {
      console.error(e)
      return
    }
  }

  const payload: RegisterCertificatePayload = {
    communityId: community.id,
    nickname,
    userCsr,
  }

  yield* put(identityActions.registerCertificate(payload))
}
