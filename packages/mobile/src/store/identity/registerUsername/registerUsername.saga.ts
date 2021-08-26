import { PayloadAction } from '@reduxjs/toolkit';
import { call, select, put } from 'typed-redux-saga';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { identitySelectors } from '../identity.selectors';
import { identityActions } from '../identity.slice';

export function* registerUsernameSaga(
  action: PayloadAction<
    ReturnType<typeof identityActions.registerUsername>['payload']
  >,
): Generator {
  // Clear possible remaining errors from previous validation
  yield* call(navigateTo, ScreenNames.RegistrationScreen, {
    error: '',
  });

  const commonName = yield* select(identitySelectors.commonName);
  const peerId = yield* select(identitySelectors.peerId);

  if (!commonName || !peerId) {
    yield* put(
      identityActions.throwIdentityError(
        "You're not connected with other peers.",
      ),
    );
    return;
  }

  const payload = {
    zbayNickname: action.payload,
    commonName: commonName,
    peerId: peerId,
    dmPublicKey: '',
    signAlg: 'ECDSA',
    hashAlg: 'sha-256',
  };

  yield* put(identityActions.createUserCsr(payload));
}
