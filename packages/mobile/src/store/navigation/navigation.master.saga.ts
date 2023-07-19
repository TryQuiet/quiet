import { all, takeEvery } from 'typed-redux-saga'
import { navigationActions } from './navigation.slice'
import { redirectionSaga } from './redirection/redirection.saga'
import { navigationSaga } from './navigation/navigation.saga'
import { replaceScreenSaga } from './replaceScreen/replaceScreen.saga'

export function* navigationMasterSaga(): Generator {
  yield all([
    takeEvery(navigationActions.redirection.type, redirectionSaga),
    takeEvery(navigationActions.navigation.type, navigationSaga),
    takeEvery(navigationActions.replaceScreen.type, replaceScreenSaga),
  ])
}
