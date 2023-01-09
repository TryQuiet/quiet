import { setEngine, CryptoEngine } from 'pkijs'

import { select, call, put } from 'typed-redux-saga'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'

export function* setupCryptoSaga(): Generator {
  const isCryptoEngineInitialized = yield* select(initSelectors.isCryptoEngineInitialized)
  if (!isCryptoEngineInitialized) {
    yield* call(initCryptoEngine)
    yield* put(initActions.setCryptoEngineInitialized(true))
  }
}

export const initCryptoEngine = () => {
  setEngine(
    'newEngine',
    new CryptoEngine({
      name: '',
      crypto,
      subtle: crypto.subtle
    })
  )
}
