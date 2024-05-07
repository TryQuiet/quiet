import { select, call, takeLeading, putResolve } from 'typed-redux-saga'
import { app } from '@quiet/state-manager'
import { persistor } from '../../store'
import { nativeServicesActions } from '../nativeServices.slice'
import { initActions } from '../../init/init.slice'
import { nativeServicesSelectors } from '../nativeServices.selectors'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../../src/const/ScreenNames.enum'

export function* leaveCommunitySaga(): Generator {
  console.log('Leaving community')

  // Restart backend
  yield* putResolve(app.actions.closeServices())

  yield takeLeading(initActions.canceledRootTask.type, clearReduxStore)
}

export function* clearReduxStore(): Generator {
  const shouldClearReduxStore = yield* select(nativeServicesSelectors.shouldClearReduxStore())
  if (!shouldClearReduxStore) return

  console.info('Clearing redux store')

  // Stop persistor
  console.info('Pausing persistor')
  yield* call(persistor.pause)
  console.info('Flushing persistor')
  yield* call(persistor.flush)
  console.info('Purging persistor')
  yield* call(persistor.purge)

  // Clear redux store
  console.info('Resetting app')
  yield* putResolve(nativeServicesActions.resetApp())

  // Resume persistor
  console.info('Resuming persistor')
  yield* call(persistor.persist)

  // Restarting persistor doesn't mark store as ready automatically
  console.info('Set store ready')
  yield* putResolve(initActions.setStoreReady())

  console.info('Opening join community screen')
  yield* putResolve(navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen }))
}
