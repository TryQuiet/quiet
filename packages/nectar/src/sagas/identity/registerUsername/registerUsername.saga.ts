import { PayloadAction } from '@reduxjs/toolkit';
import { select, put } from 'typed-redux-saga';
import { identitySelectors } from '../identity.selectors';
import { identityActions } from '../identity.slice';
import { errorsActions } from '../../errors/errors.slice';
import { config } from '../../users/const/certFieldTypes';

export function* registerUsernameSaga(
  action: PayloadAction<string>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity);
  const commonName = identity.hiddenService.onionAddress;
  const peerId = identity.peerId.id;
  const dmPublicKey = identity.dmKeys.publicKey;

  console.log('registerUsernameSaga');

  if (!commonName || !peerId) {
    yield* put(
      errorsActions.certificateRegistration(
        "You're not connected with other peers."
      )
    );
    return;
  }

  yield* put(
    identityActions.updateUsername({
      communityId: identity.id,
      nickname: action.payload,
    })
  );

  const payload = {
    zbayNickname: action.payload,
    commonName: `${commonName}.onion`,
    peerId,
    dmPublicKey,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  };

  yield* put(identityActions.createUserCsr(payload));
}
