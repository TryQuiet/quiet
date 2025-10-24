import { apply, put } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../types'
import { SocketActions } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('captchaRelaySaga')

export function* captchaRelaySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.hcaptchaTokenReceived>['payload']>
): Generator {
  logger.info('Relaying hCaptcha token to server')
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.HCAPTCHA_TOKEN_RECEIVED, action.payload.token))
}
