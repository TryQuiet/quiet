import { delay, put, select } from 'typed-redux-saga'
import { initSelectors } from '../../init.selectors'
import { initActions } from '../../init.slice'

const WEBSOCKET_CONNECTION_DELAY = 15000

export function* restoreConnectionSaga(): Generator {
  // Give the worker time to init websocket connection
  yield* delay(WEBSOCKET_CONNECTION_DELAY + 1000)

  const isWebsocketConnected = yield* select(initSelectors.isWebsocketConnected)
  const socketIOData = yield* select(initSelectors.lastKnownSocketIOData)

  console.log('WEBSOCKET', 'Entered restore connection saga', isWebsocketConnected, socketIOData)

  if (!isWebsocketConnected && socketIOData.dataPort !== 0) {
    console.log('WEBSOCKET', 'Restoring connection with data port: ', socketIOData.dataPort)
    yield* put(initActions.startWebsocketConnection(socketIOData))
  }
}
