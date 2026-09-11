import { apply, put } from 'typed-redux-saga'

import { type LinkedDevice, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { connectionActions } from '../connection.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('connection:linkedDevices:getLinkedDevices')

/** Refreshes the current user's device list from the backend's team graph. */
export function* getLinkedDevicesSaga(socket: Socket): Generator {
  const devices: LinkedDevice[] | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.GET_LINKED_DEVICES, {})
  )
  logger.info(`Linked devices: ${devices?.length ?? 0}`)
  yield* put(connectionActions.setLinkedDevices(devices ?? []))
}
