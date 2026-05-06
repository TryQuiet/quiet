import { apply, select, delay, put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { InviteResult } from '@localfirst/auth'

import { SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { connectionActions } from '../connection.slice'
import { connectionSelectors } from '../connection.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('connection:invite:toggleP2P')

export function* toggleP2PSaga(socket: Socket): Generator {
  logger.info('Toggling P2P')
  const p2pEnabled: boolean = yield* select(connectionSelectors.p2pEnabled)
  logger.info('Current P2P state:', p2pEnabled)
  const response = yield* apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.TOGGLE_P2P, !p2pEnabled))
  logger.info('Toggled P2P, new state:', response)
  yield* put(connectionActions.setP2PEnabled(response))
}
