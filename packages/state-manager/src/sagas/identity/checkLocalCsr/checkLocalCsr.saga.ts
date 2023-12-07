import { select, call, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../identity.slice'
import { identitySelectors } from '../identity.selectors'
import { CertFieldsTypes, getReqFieldValue, loadCSR, pubKeyFromCsr } from '@quiet/identity'

export function* checkLocalCsrSaga(
  action: PayloadAction<ReturnType<typeof identityActions.checkLocalCsr>['payload']>
): Generator {
  console.log('Checking local CSR', action.payload.csrs)

  const { csrs } = action.payload

  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    console.error('Could not check local csr, no identity.')
    return
  }

  if (!identity.userCsr) {
    console.warn("Identity doesn't have userCsr.")
    return
  }

  const pubKey = yield* call(pubKeyFromCsr, identity.userCsr.userCsr)

  const storedCsr = Object.keys(csrs).find(key => key === pubKey)

  if (storedCsr) {
    console.log('Stored CSR with the same public key found, checking for username integirty.', pubKey)

    const parsedCsr = yield* call(loadCSR, storedCsr)
    const nickname = yield* call(getReqFieldValue, parsedCsr, CertFieldsTypes.nickName)

    if (nickname == identity.nickname) {
      console.log('Stored CSR is equal to the local one, skipping.')
      return
    }
  }

  console.log('Stored CSR differs or missing, saving local one.')

  yield* put(identityActions.saveUserCsr())
}
