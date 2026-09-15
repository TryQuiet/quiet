import { apply, putResolve } from 'typed-redux-saga'

import { type DeviceLinkInvite, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { connectionActions } from '../connection.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('connection:invite:createDeviceLink')

export function* createDeviceLinkSaga(socket: Socket): Generator {
  let deviceLinkInvite: DeviceLinkInvite | undefined
  try {
    deviceLinkInvite = yield* apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.CREATE_DEVICE_LINK, {}))
  } catch (error) {
    logger.error('failed to create device link', error)
  }
  logger.info('setting device link invite in state')
  yield* putResolve(connectionActions.setDeviceLinkInvite(deviceLinkInvite))
  yield* putResolve(connectionActions.setDeviceLinkCreationFailed(!deviceLinkInvite))
}
