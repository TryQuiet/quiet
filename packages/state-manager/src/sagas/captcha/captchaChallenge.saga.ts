import { apply, put, select, take } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../types'
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
  yield* put(captchaActions.setCaptchaRequestPending(true))
  yield* apply(socket, socket.emit, [SocketActions.HCAPTCHA_REQUEST])
  while (true) {
    const responseAction: ReturnType<typeof captchaActions.captchaFormResponse> = yield* take(
      captchaActions.captchaFormResponse
    )
    if (responseAction.payload.error) {
      logger.warn('hCaptcha challenge resulted in error:', responseAction.payload.error)
      yield* put(captchaActions.setCaptchaRequestPending(false))
      yield* put(captchaActions.setChallengeResult({ success: false, cancelled: true }))
      break
    } else if (responseAction.payload.token) {
      logger.info('hCaptcha challenge completed successfully. Verifying token...')
      while (true) {
        const captchaVerifiedAction = yield* take(captchaActions.setCaptchaVerified)
        if (captchaVerifiedAction.payload === true) {
          logger.info('Captcha verified')
          yield* put(captchaActions.setCaptchaRequestPending(false))
          yield* put(captchaActions.setChallengeResult({ success: true, cancelled: false }))
          return
        }
        if (captchaVerifiedAction.payload === false) {
          logger.warn('Captcha verification failed')
          yield* put(captchaActions.setCaptchaRequestPending(false))
          yield* put(captchaActions.setChallengeResult({ success: false, cancelled: false }))
          break
        }
      }
    }
  }
}
