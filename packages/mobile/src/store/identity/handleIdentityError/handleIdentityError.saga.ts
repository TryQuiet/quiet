import { PayloadAction } from '@reduxjs/toolkit';
import { call } from 'typed-redux-saga';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { identityActions } from '../identity.slice';

export function* handleIdentityError(
  action: PayloadAction<
    ReturnType<typeof identityActions.throwIdentityError>['payload']
  >,
): Generator {
  yield* call(navigateTo, ScreenNames.RegistrationScreen, {
    error: action.payload,
  });
}
