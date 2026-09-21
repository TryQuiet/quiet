import { actionChannel, apply, put, select, take } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from '../../types'
import { SocketActions } from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { captchaActions } from './captcha.slice'
import { captchaSelectors } from './captcha.selectors'

const logger = createLogger('captchaChallengeSaga')

export function* captchaChallengeSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof captchaActions.presentChallenge>['payload']>
): Generator {
  logger.info('Presenting hCaptcha challenge to user')
  const existingVerifcationStatus = yield* select(captchaSelectors.captchaVerified)
  if (existingVerifcationStatus === true) {
    logger.info('Captcha already verified, skipping challenge')
    yield* put(captchaActions.setChallengeResult({ success: true, cancelled: false }))
    return
  }
  // Desktop tokens arrive over IPC, while verification state arrives over
  // Socket.IO. A connection reset can therefore arrive after the token. Keep
  // listening to both streams, including while requesting a retry.
  const responses = yield* actionChannel([
    captchaActions.captchaFormResponse.type,
    captchaActions.setCaptchaVerified.type,
  ])
  try {
    yield* put(captchaActions.setCaptchaRequestPending(true))
    yield* apply(socket, socket.emit, [SocketActions.HCAPTCHA_REQUEST])
    while (true) {
      const response = yield* take(responses)
      if (captchaActions.setCaptchaVerified.match(response)) {
        if (response.payload) {
          logger.info('Captcha verified')
          yield* put(captchaActions.setChallengeResult({ success: true, cancelled: false }))
          return
        }
        // The backend deduplicates requests while verification is in flight.
        // Retry here: takeLeading ignores another presentChallenge until this
        // handler finishes, which used to strand the community creation saga.
        yield* apply(socket, socket.emit, [SocketActions.HCAPTCHA_REQUEST])
      } else if (captchaActions.captchaFormResponse.match(response) && response.payload.error) {
        logger.warn('hCaptcha challenge resulted in error:', response.payload.error)
        yield* put(captchaActions.setChallengeResult({ success: false, cancelled: true }))
        return
      }
    }
  } finally {
    responses.close()
    yield* put(captchaActions.setCaptchaRequestPending(false))
  }
}
