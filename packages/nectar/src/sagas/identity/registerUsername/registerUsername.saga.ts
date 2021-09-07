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
    ReturnType<any>['payload']
  >
): Generator {
  console.log('registerUsernameSaga');

  const identity = yield* select(identitySelectors.selectById())

  // @ts-ignore
  const commonName = identity.hiddenService.onionAddress
  const peerId = identity.peerId.id
  const dmPublicKey = identity.dmKeys.publicKey

  if (!commonName || !peerId) {
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
    peerId,
    dmPublicKey,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  };

  yield* put(identityActions.createUserCsr(payload));
}