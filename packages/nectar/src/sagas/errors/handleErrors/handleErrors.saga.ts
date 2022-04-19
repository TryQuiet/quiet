import { PayloadAction } from '@reduxjs/toolkit'
import { call, delay, put, select } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { errorsActions } from '../errors.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { ErrorCodes, ErrorPayload } from '../errors.types'
import { RegisterCertificatePayload } from '../../identity/identity.types'
import logger from '../../../utils/logger'

const log = logger('errors')

function* retryRegistration(communityId: string) {
  const identity = yield* select(identitySelectors.selectById(communityId))

  const payload: RegisterCertificatePayload = {
    communityId: communityId,
    nickname: identity.nickname,
    userCsr: identity.userCsr
  }

  yield* put(identityActions.registerCertificate(payload))
  log(`registering certificate for community ${communityId} failed, trying again`)
}

let registrationAttempts: number = 0

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload
  if (error.type === SocketActionTypes.REGISTRAR) {
    if (error.code === ErrorCodes.FORBIDDEN) {
      yield* put(errorsActions.addError(error))
    }
    if (error.code === ErrorCodes.NOT_FOUND || error.code === ErrorCodes.SERVER_ERROR || error.code === ErrorCodes.SERVICE_UNAVAILABLE) {
      // 7 retries guarantees 99.9% chance of registering username if registrar is online.
      if (registrationAttempts < 7) {
        yield* call(delay, 5000)
        registrationAttempts++
        yield* call(retryRegistration, error.community)
      } else {
        yield* put(errorsActions.addError(error))
        registrationAttempts = 0
      }
    }
  } else {
    yield* put(errorsActions.addError(error))
  }
}
