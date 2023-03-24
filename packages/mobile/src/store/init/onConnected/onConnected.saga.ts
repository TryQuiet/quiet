import { select, put } from 'typed-redux-saga'
import { identity } from '@quiet/state-manager'
import { initSelectors } from '../init.selectors'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'

export function* onConnectedSaga(): Generator {
  // Do not redirect if user opened the app from url (quiet://)
  const deepLinking = yield* select(initSelectors.deepLinking)
  if (deepLinking) return

  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  const screen = !currentIdentity?.userCertificate
    ? ScreenNames.JoinCommunityScreen
    : ScreenNames.ChannelListScreen

  yield* put(navigationActions.replaceScreen({
    screen: screen
  }))
}
