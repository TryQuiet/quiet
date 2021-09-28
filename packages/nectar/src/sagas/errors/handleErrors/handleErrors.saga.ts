import { PayloadAction } from '@reduxjs/toolkit';
import { errorsActions } from '../errors.slice';

export function* handleErrorSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  console.log('HANDLING ERROR SAGA', action.payload);
}
