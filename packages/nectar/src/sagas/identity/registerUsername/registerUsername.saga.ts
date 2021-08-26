import { PayloadAction } from '@reduxjs/toolkit';
import { call, select, put } from 'typed-redux-saga';
// import { ScreenNames } from '../../../const/ScreenNames.enum';
// import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { identitySelectors } from '../identity.selectors';
import { identityActions } from '../identity.slice';
import {errorsActions} from '../../errors/errors.slice'
import {config} from '../../users/const/certFieldTypes'

export function* registerUsernameSaga(
  action: PayloadAction<
    ReturnType<typeof identityActions.registerUsername>['payload']
  >
): Generator {
  console.log('registerUsernameSaga');

  // TODO

  // yield* put(errorHapened, {
  //   type: '',
  //   message: ''
  // })
  // Clear possible remaining errors from previous validation
  // yield* call(navigateTo, ScreenNames.RegistrationScreen, {
  //   error: '',
  // });

  const commonName = yield* select(identitySelectors.commonName);
  const peerId = yield* select(identitySelectors.peerId);
  const dmPublicKey = yield* select(identitySelectors.dmPublicKey);

  

  if (!commonName || !peerId || !dmPublicKey) {
    yield* put(
      errorsActions.certificateRegistration(
        "You're not connected with other peers."
      )
    );
    return;
  }

  console.log(action.payload, 'nickname is nectar')

  const payload = {
    zbayNickname: action.payload,
    commonName,
    peerId: 'asdfasdfasdfasdfasdf',
    dmPublicKey,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  };

  console.log(payload, 'paylaod for createusercsr')

  yield* put(identityActions.createUserCsr(payload));
}