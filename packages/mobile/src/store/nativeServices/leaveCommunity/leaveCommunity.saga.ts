import { select, call, put, takeLeading } from 'typed-redux-saga'
import { app } from '@quiet/state-manager'
import { persistor } from '../../store'
import { nativeServicesActions } from '../nativeServices.slice'
import { initActions } from '../../init/init.slice'
import { nativeServicesSelectors } from '../nativeServices.selectors'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../../src/const/ScreenNames.enum'

export function* leaveCommunitySaga(): Generator {
  // Restart backend
  yield* put(app.actions.closeServices())

  yield takeLeading(initActions.canceledRootTask.type, clearReduxStore)
}

export function* clearReduxStore(): Generator {
  const shouldClearReduxStore = yield* select(nativeServicesSelectors.shouldClearReduxStore())
  if (!shouldClearReduxStore) return

  console.info('Clearing redux store')

  // Stop persistor
  // yield* call(persistor.pause)
  // yield* call(persistor.flush)
  // yield* call(persistor.purge)

  // Clear redux store
  yield* put(nativeServicesActions.resetApp())

  // Resume persistor
  // yield* call(persistor.persist)

  yield* put(navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen }))
}
