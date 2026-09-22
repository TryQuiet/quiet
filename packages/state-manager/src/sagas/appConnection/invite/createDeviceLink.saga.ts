import { apply, putResolve, select } from 'typed-redux-saga'

import { type DeviceLinkInvite, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { connectionActions } from '../connection.slice'
import { connectionSelectors } from '../connection.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('connection:invite:createDeviceLink')

export function* createDeviceLinkSaga(socket: Socket): Generator {
  const activeInvite = yield* select(connectionSelectors.deviceLinkInvite)
  if (activeInvite && activeInvite.expiresAt > Date.now()) return

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
