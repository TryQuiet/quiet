import { apply, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../types'
import { SocketActions } from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { captchaActions } from './captcha.slice'

const logger = createLogger('captchaRelaySaga')

export function* captchaRelaySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof captchaActions.setHcaptchaFormResponse>['payload']>
): Generator {
  logger.info('Relaying hCaptcha token to server')
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.HCAPTCHA_FORM_RESPONSE, action.payload))
}
