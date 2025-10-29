import { type Socket } from '../../types'
import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { createLogger } from '../../utils/logger'
import { captchaRelaySaga } from './captchaRelay.saga'
import { captchaActions } from './captcha.slice'

const logger = createLogger('captchaMasterSaga')

export function* captchaMasterSaga(socket: Socket): Generator {
  try {
    yield all([takeEvery(captchaActions.setHcaptchaFormResponse.type, captchaRelaySaga, socket)])
  } finally {
    if (yield cancelled()) {
      logger.info('captchaMasterSaga cancelled')
    }
  }
}
