import CryptoEngine from 'pkijs/src/CryptoEngine';
import { setEngine } from 'pkijs/src/common';

import { select, call, put } from 'typed-redux-saga';
import { initSelectors } from '../init.selectors';
import { initActions } from '../init.slice';

declare global {
  interface Crypto {
    subtle: any;
  }
  let crypto: Crypto;
}

export function* setupCryptoSaga(): Generator {
  const isCryptoEngineInitialized = yield* select(
    initSelectors.isCryptoEngineInitialized,
  );
  if (!isCryptoEngineInitialized) {
    yield* call(initCryptoEngine);
    yield* put(initActions.setCryptoEngineInitialized(true));
  }
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
