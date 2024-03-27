import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import createLogger from '../../../utils/logger'

const logger = createLogger('identity')

export function* saveUserCsrSaga(socket: Socket): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity?.userCsr) {
    logger.error('Cannot save user csr to backend, no userCsr')
    return
  }

  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }

  logger.info(`Send ${SocketActionTypes.ADD_CSR}`)
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.ADD_CSR, payload))
}
