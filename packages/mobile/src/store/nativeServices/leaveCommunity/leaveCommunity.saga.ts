import { call, put, takeLeading } from 'typed-redux-saga'
import { app } from '@quiet/state-manager'
import { persistor } from '../../store'
import { nativeServicesActions } from '../nativeServices.slice'
import { initActions } from '../../init/init.slice'

export function* leaveCommunitySaga(): Generator {
  // Restart backend
  yield* put(app.actions.closeServices())

  yield takeLeading(initActions.suspendWebsocketConnection.type, clearReduxStore)
}

export function* clearReduxStore(): Generator {
  // Stop persistor
  yield* call(persistor.pause)
  yield* call(persistor.flush)
  yield* call(persistor.purge)

  // Clear redux store
  yield* put(nativeServicesActions.resetApp())

  // Resume persistor
  yield* call(persistor.persist)
}
