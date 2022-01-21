import { PayloadAction } from '@reduxjs/toolkit'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { call, put, select } from 'typed-redux-saga'
import logger from '../../../utils/logger'
import { errorsActions } from '../errors.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { ErrorPayload } from '../errors.types'
const log = logger('errors')

function* retryRegistration(communityId: string) {
  const identity = yield* select(identitySelectors.selectById(communityId))
  const registrarAddress = yield* select(
    communitiesSelectors.registrarUrl(communityId)
  )

  const payload = {
    communityId,
    userCsr: identity.userCsr,
    registrarAddress
  }
  yield* put(identityActions.storeUserCsr(payload))
  log(`registering certificate for community ${communityId} failed, trying again`)
}

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload
  if (error.type === SocketActionTypes.REGISTRAR) {
    if (error.code >= 500) {
      yield* call(retryRegistration, error.communityId)
    }
  }
}
