import { PayloadAction } from '@reduxjs/toolkit'
import { call, put, select } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { errorsActions } from '../errors.slice'
import { ErrorPayload } from '../errors.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import logger from '../../../utils/logger'

const log = logger('errors')

function* retryRegistration(communityId: string) {
  const identity = yield* select(identitySelectors.selectById(communityId))

  const payload = {
    communityId: communityId,
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
    if (error.code === 500) {
      yield* call(retryRegistration, error.community)
    }
  }
}
