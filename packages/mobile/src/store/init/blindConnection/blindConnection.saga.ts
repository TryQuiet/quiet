import { select, put } from 'typed-redux-saga'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'

export function* blindConnectionSaga(): Generator {
  const isWebsocketConnected = yield* select(initSelectors.isWebsocketConnected)
  const lastKnownSocketIOData = yield* select(initSelectors.lastKnownSocketIOData)

  console.log('WEBSOCKET', 'Entered blind connection saga', isWebsocketConnected, lastKnownSocketIOData)

  if (!isWebsocketConnected && lastKnownSocketIOData.dataPort !== 0) {
    console.log('WEBSOCKET', 'Hooking up blindly at last known data port: ', lastKnownSocketIOData.dataPort)
    yield* put(initActions.startWebsocketConnection(lastKnownSocketIOData))
  }
}
