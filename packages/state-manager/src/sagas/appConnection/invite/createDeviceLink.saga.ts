import { apply, putResolve } from 'typed-redux-saga'

import { type DeviceLinkInvite, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { connectionActions } from '../connection.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('connection:invite:createDeviceLink')

export function* createDeviceLinkSaga(socket: Socket): Generator {
  const deviceLinkInvite: DeviceLinkInvite | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.CREATE_DEVICE_LINK, {})
  )
  logger.info('setting device link invite in state')
  yield* putResolve(connectionActions.setDeviceLinkInvite(deviceLinkInvite))
}
