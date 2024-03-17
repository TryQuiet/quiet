import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { apply, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import { LoggerModuleName, loggingHandler } from 'packages/state-manager/src/utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.IDENTITY, LoggerModuleName.SAGA, 'saveUserCsr'])

export function* saveUserCsrSaga(socket: Socket): Generator {
  LOGGER.info(`Saving user CSR`)
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity?.userCsr) {
    LOGGER.error('Cannot save user csr to backend, no userCsr')
    return
  }

  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }

  LOGGER.info(`Send socket event ${SocketActionTypes.ADD_CSR}`)
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.ADD_CSR, payload))
}
