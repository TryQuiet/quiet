import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { apply, call, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import { usersSelectors } from '../../users/users.selectors'
import { keyFromCertificate, parseCertificationRequest } from '@quiet/identity'

export function* saveUserCsrSaga(socket: Socket): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity?.userCsr) {
    console.error('Cannot save user csr to backend, no userCsr')
    return
  }

  // Because we run this saga everytime we launch community (to make sure that our csr is saved to db) we need below logic to avoid duplicates of csrs in the csr database.
  const parsedCsr = parseCertificationRequest(identity.userCsr.userCsr)
  const pubKey = yield* call(keyFromCertificate, parsedCsr)
  const csrs = yield* select(usersSelectors.csrsMapping)
  if (Object.keys(csrs).includes(pubKey)) return

  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }
  console.log(`Send ${SocketActionTypes.SAVE_USER_CSR}`)
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SAVE_USER_CSR, payload))
}