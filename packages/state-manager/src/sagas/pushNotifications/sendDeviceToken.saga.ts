import { apply } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from '../../types'
import { SocketActions } from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { applyEmitParams } from '../../types'

const logger = createLogger('sendDeviceTokenSaga')

export function* sendDeviceTokenSaga(socket: Socket, action: PayloadAction<string>): Generator {
  const deviceToken = action.payload
  logger.info('Sending device token to backend')
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_DEVICE_TOKEN, { deviceToken }))
}
