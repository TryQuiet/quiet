import { call, select, put } from 'typed-redux-saga';
import { identityActions, UserCsr } from '../identity.slice';
import { createUserCsr } from '@zbayapp/identity';
import { initSelectors } from '../../init/init.selectors';
import { initActions } from '../../init/init.slice';
import CryptoEngine from 'pkijs/src/CryptoEngine';
import { setEngine } from 'pkijs/src/common';
import { PayloadAction } from '@reduxjs/toolkit';

declare global {
  interface Crypto {
    subtle: any;
  }
  let crypto: Crypto;
}

export function* createUserCsrSaga(
  action: PayloadAction<
    ReturnType<typeof identityActions.createUserCsr>['payload']
  >,
): Generator {
  let csr: UserCsr;

  const isCryptoEngineInitialized = yield* select(
    initSelectors.isCryptoEngineInitialized,
  );
  if (!isCryptoEngineInitialized) {
    yield* call(initCryptoEngine);
    yield* put(initActions.setCryptoEngineInitialized(true));
  }

  try {
    csr = yield* call(createUserCsr, action.payload);
  } catch (e) {
    console.error(e);
    return;
  }

  yield* put(identityActions.storeUserCsr(csr));
}

export const initCryptoEngine = () => {
  setEngine(
    'newEngine',
    crypto,
    new CryptoEngine({
      name: '',
      crypto,
      subtle: crypto.subtle,
    }),
  );
};
