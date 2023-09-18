import { put } from 'typed-redux-saga'
import { initActions } from '../init.slice'

export function* onConnectedSaga(): Generator {
  yield* put(initActions.setReady(true))
}
