import { PayloadAction } from '@reduxjs/toolkit'
import { apply } from 'typed-redux-saga'
import { appActions } from '../app.slice'
import { Socket } from '../../../types'
import { SocketActionTypes } from '@quiet/types'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.APP, LoggerModuleName.SAGA, 'stopBackend'])

export function* stopBackendSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof appActions.stopBackend>['payload']>
): Generator {
  LOGGER.info(`Stopping backend, emitting ${SocketActionTypes.CLOSE} socket event`)
  yield* apply(socket, socket.emit, [SocketActionTypes.CLOSE])
}
