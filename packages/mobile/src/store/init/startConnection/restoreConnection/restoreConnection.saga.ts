import { delay, put, select, take } from 'typed-redux-saga'
import { initSelectors } from '../../init.selectors'
import { initActions } from '../../init.slice'

const WEBSOCKET_CONNECTION_DELAY = 5000

export function* restoreConnectionSaga(): Generator {
  // Give the worker time to init websocket connection
  yield* delay(WEBSOCKET_CONNECTION_DELAY + 1000)

  const isWebsocketConnected = yield* select(initSelectors.isWebsocketConnected)
  const dataPort = yield* select(initSelectors.lastKnownDataPort)

  if (!isWebsocketConnected && dataPort !== 0) {
    yield* put(
      initActions.startWebsocketConnection({
        dataPort: dataPort
      })
    )
  }
}
