import { type PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { errorsActions } from '../errors.slice'
import { type ErrorPayload } from '@quiet/types'
import { ErrorMessages, SocketActions } from '@quiet/types'
import { communitiesActions } from '../../communities/communities.slice'

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload

  yield* put(errorsActions.addError(error))
  if (
    error.community &&
    error.type === SocketActions.LAUNCH_COMMUNITY &&
    (error.message === ErrorMessages.ADMISSION_TIMEOUT || error.message === ErrorMessages.ADMISSION_INTERRUPTED)
  ) {
    yield* put(communitiesActions.resetAdmission(error.community))
  }
}
