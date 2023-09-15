import { select, put } from 'typed-redux-saga'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'

export function* blindConnectionSaga(): Generator {
  const lastKnownDataPort = yield* select(initSelectors.lastKnownDataPort)
  yield* put(
    initActions.startWebsocketConnection({
      dataPort: lastKnownDataPort,
    })
  )
}
