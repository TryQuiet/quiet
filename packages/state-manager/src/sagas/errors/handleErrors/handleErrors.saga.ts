import { PayloadAction } from '@reduxjs/toolkit'
import { call, delay, put, select } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identityActions } from '../../identity/identity.slice'
import { errorsActions } from '../errors.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import logger from '../../../utils/logger'
import { RegisterCertificatePayload, ErrorPayload, ErrorCodes } from '@quiet/types'

const log = logger('errors')

export function* retryRegistration(communityId: string) {
  const identity = yield* select(identitySelectors.selectById(communityId))
  if (!identity?.userCsr) {
    console.error('Error retrying registration. Lacking identity data')
    return
  }

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

  yield* put(errorsActions.addError(error))

  if (error.type === SocketActionTypes.REGISTRAR) {
    if (
      error.code === ErrorCodes.NOT_FOUND ||
      error.code === ErrorCodes.SERVER_ERROR ||
      error.code === ErrorCodes.SERVICE_UNAVAILABLE
    ) {
      if (!error.community) {
        console.error(`Received error ${error} without community`)
        return
      }
      // Leave for integration test assertions purposes
      const registrationAttempts = yield* select(
        communitiesSelectors.registrationAttempts(error.community)
      )
      yield* put(communitiesActions.updateRegistrationAttempts({ id: error.community, registrationAttempts: registrationAttempts + 1 }))
      yield* call(retryRegistration, error.community)
    }
  }
}
