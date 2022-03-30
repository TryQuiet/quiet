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

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload
  if (error.type === SocketActionTypes.REGISTRAR) {
    if (error.code === ErrorCodes.NOT_FOUND) {
      yield* call(delay, 5000)
      yield* call(retryRegistration, error.community)
    }
  }
}
