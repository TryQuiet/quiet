import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put, call } from 'typed-redux-saga'
import { createUserCsr } from '@quiet/identity'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'
import { config } from '../../users/const/certFieldTypes'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { type CreateUserCsrPayload, type RegisterCertificatePayload } from '@quiet/types'

export function* registerUsernameSaga(action: PayloadAction<string>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    console.error('Could not register username, no identity')
    return
  }

  // Nickname can differ between saga calls
  const nickname = action.payload

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
      userCsr = yield* call(createUserCsr, payload)
    } catch (e) {
      console.error(e)
      return
    }
  }

  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  if (!currentCommunity) return

  const payload: RegisterCertificatePayload = {
    communityId: currentCommunity.id,
    nickname,
    userCsr,
  }

  yield* put(identityActions.registerCertificate(payload))
}
