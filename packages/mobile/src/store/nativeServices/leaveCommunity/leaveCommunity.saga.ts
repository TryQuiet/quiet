import { select, call, putResolve } from 'typed-redux-saga'
import { app } from '@quiet/state-manager'
import { persistor } from '../../store'
import { nativeServicesActions } from '../nativeServices.slice'
import { initActions } from '../../init/init.slice'
import { nativeServicesSelectors } from '../nativeServices.selectors'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../../src/const/ScreenNames.enum'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('leaveCommunity')

export function* leaveCommunitySaga(): Generator {
  logger.info('Leaving community')
  // Restart backend
  yield* putResolve(app.actions.closeServices())
}

export function* clearReduxStore(): Generator {
  const shouldClearReduxStore = yield* select(nativeServicesSelectors.shouldClearReduxStore())
  if (!shouldClearReduxStore) return

  logger.info('Clearing redux store')

  // Stop persistor
  logger.info('Pausing persistor')
  yield* call(persistor.pause)
  logger.info('Flushing persistor')
  yield* call(persistor.flush)
  logger.info('Purging persistor')
  yield* call(persistor.purge)

  // Clear redux store
  logger.info('Resetting app')
  yield* putResolve(nativeServicesActions.resetApp())

  // Resume persistor
  logger.info('Resuming persistor')
  yield* call(persistor.persist)

  // Restarting persistor doesn't mark store as ready automatically
  logger.info('Set store ready')
  yield* putResolve(initActions.setStoreReady())

  logger.info('Opening join community screen')
  yield* putResolve(navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen }))
}
