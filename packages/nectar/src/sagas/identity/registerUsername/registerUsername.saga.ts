import { PayloadAction } from '@reduxjs/toolkit';
import { select, put } from 'typed-redux-saga';
import { identitySelectors } from '../identity.selectors';
import { identityActions } from '../identity.slice';
import { errorsActions } from '../../errors/errors.slice';
import { config } from '../../users/const/certFieldTypes';
import logger from '../../../utils/logger';
const log = logger('identity');

export function* registerUsernameSaga(
  action: PayloadAction<string>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity);
  const commonName = identity.hiddenService.onionAddress;
  const peerId = identity.peerId.id;
  const dmPublicKey = identity.dmKeys.publicKey;

  log('registerUsernameSaga');

  if (!commonName || !peerId) {
    yield* put(
      errorsActions.addError({
        communityId: identity.id,
        type: 'registrar', // TODO: what type of error?
        code: 403,
        message: "You're not connected with other peers.",
      })
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
    commonName: commonName,
    peerId,
    dmPublicKey,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  };

  yield* put(identityActions.createUserCsr(payload));
}
