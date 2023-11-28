import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'

export function* saveUserCsrSaga(socket: Socket): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity?.userCsr) {
    console.error('Cannot save user csr to backend, no userCsr')
    return
  }
  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }
  console.log(`Send ${SocketActionTypes.SAVE_USER_CSR}`)
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SAVE_USER_CSR, payload))
}
