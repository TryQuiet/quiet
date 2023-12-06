import { apply, select } from 'typed-redux-saga'
import { SaveCsrPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { identitySelectors } from '../identity.selectors'

export function* saveUserCsrSaga(socket: Socket): Generator {
  console.log(`Send ${SocketActionTypes.SAVE_USER_CSR}`)

  const csr = yield* select(identitySelectors.csr)
  if (!csr) return

  const payload: SaveCsrPayload = { csr: csr.userCsr }
  
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SAVE_USER_CSR, payload))
}
