import { select, put, call } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { createUserCsr, getPubKey, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { CreateUserCsrPayload } from '@quiet/types'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'
import { config } from '../../users/const/certFieldTypes'

export function* chooseUsernameSaga(
  action: PayloadAction<ReturnType<typeof identityActions.chooseUsername>['payload']>
): Generator {
  // Nickname can differ between saga calls
  const { nickname } = action.payload

  let identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    console.error('Could not register username, no current identity')
    return
  }

  let existingKeyPair: CryptoKeyPair | undefined = undefined

  let { userCsr: existingCsr } = identity

  if (existingCsr) {
    if (existingCsr?.userCsr == null || existingCsr.userKey == null) {
      console.error('identity.userCsr?.userCsr == null || identity.userCsr.userKey == null')
      return
    }

    const _pubKey = yield* call(pubKeyFromCsr, existingCsr.userCsr)

    const privateKey  =   yield* call(loadPrivateKey, existingCsr.userKey, config.signAlg)
    const publicKey   =   yield* call(getPubKey, _pubKey)

    existingKeyPair = {
      privateKey: privateKey,
      publicKey: publicKey,
    }
  }

  const payload: CreateUserCsrPayload = {
    nickname,
    commonName: identity.hiddenService.onionAddress,
    peerId: identity.peerId.id,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
    existingKeyPair: existingKeyPair
  }

  const userCsr = yield* call(createUserCsr, payload)

  yield* put(identityActions.storeUserCsr({
    csr: userCsr,
  }))
}
