import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveUserCsrSaga')

export function* saveUserCsrSaga(socket: Socket): Generator {
  logger.info('Saving user CSR')

  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    logger.error('Cannot save user CSR to backend, no identity')
    return
  }

  if (!identity.userCsr) {
    logger.error('Cannot save user CSR to backend, no userCsr', identity)
    return
  }

  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }

  logger.info('Emitting ADD_CSR')
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.ADD_CSR, payload))
}
