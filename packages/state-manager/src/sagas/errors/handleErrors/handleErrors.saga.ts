import { PayloadAction } from '@reduxjs/toolkit'
import { call, delay, put, select } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { errorsActions } from '../errors.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { ErrorCodes, ErrorPayload } from '../errors.types'
import { RegisterCertificatePayload } from '../../identity/identity.types'
import logger from '../../../utils/logger'

const log = logger('errors')

export function* retryRegistration(communityId: string) {
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
  const registrationAttempts = yield* select(
    communitiesSelectors.registrationAttempts(error.community)
  )

  if (error.type === SocketActionTypes.REGISTRAR) {
    if (error.code === ErrorCodes.FORBIDDEN) {
      yield* put(errorsActions.addError(error))
    }
    if (
      error.code === ErrorCodes.NOT_FOUND ||
      error.code === ErrorCodes.SERVER_ERROR ||
      error.code === ErrorCodes.SERVICE_UNAVAILABLE
    ) {
      // Arbitrary attempts number that is 99.99% sufficient for registration without asking user to resubmit form
      if (registrationAttempts < 200) {
        yield* call(delay, 5000)
        yield* put(communitiesActions.updateRegistrationAttempts({ id: error.community, registrationAttempts: registrationAttempts + 1 }))
        yield* put(errorsActions.addError(error))
        yield* call(retryRegistration, error.community)
      } else {
        yield* put(errorsActions.addError(error))
        yield* put(communitiesActions.updateRegistrationAttempts({ id: error.community, registrationAttempts: 0 }))
      }
    }
  } else {
    yield* put(errorsActions.addError(error))
  }
}
