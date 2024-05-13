import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import createLogger from '../../../utils/logger'

const logger = createLogger('identity')

export function* saveUserCsrSaga(socket: Socket): Generator {
  console.log('Saving user CSR')

  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    console.error('Cannot save user CSR to backend, no identity')
    return
  }

  if (!identity.userCsr) {
    console.error('Cannot save user CSR to backend, no userCsr', identity)
    return
  }

  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }

  console.log('Emitting ADD_CSR')
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.ADD_CSR, payload))
}
