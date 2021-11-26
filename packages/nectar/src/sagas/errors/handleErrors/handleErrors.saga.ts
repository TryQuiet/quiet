import { PayloadAction } from '@reduxjs/toolkit';
import { put } from 'typed-redux-saga';
import logger from '../../../utils/logger';
import { errorsActions, GENERAL_ERRORS } from '../errors.slice';
const log = logger('errors');

export function* handleErrorSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  log('received error', action.payload);
  const communityId = action.payload.communityId
    ? action.payload.communityId
    : GENERAL_ERRORS;
  yield* put({ type: `${communityId}.${action.payload.type}.error` });
}
