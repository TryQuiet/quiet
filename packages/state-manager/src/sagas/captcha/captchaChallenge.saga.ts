import { apply, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../types'
import { SocketActions } from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { captchaActions } from './captcha.slice'

const logger = createLogger('captchaChallengeSaga')

export function* captchaChallengeSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof captchaActions.presentChallenge>['payload']>
): Generator {
  logger.info('Presenting hCaptcha challenge to user')
  yield* apply(socket, socket.emit, [SocketActions.HCAPTCHA_REQUEST])
}
