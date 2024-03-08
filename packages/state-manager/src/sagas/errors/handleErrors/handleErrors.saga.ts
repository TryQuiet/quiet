import { type PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { errorsActions } from '../errors.slice'
import { type ErrorPayload } from '@quiet/types'

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload

  yield* put(errorsActions.addError(error))
}
