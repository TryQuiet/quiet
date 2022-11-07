import { select, put } from 'typed-redux-saga'
import { identity } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'

export function* onConnectedSaga(): Generator {
  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  const screen = !currentIdentity?.userCertificate 
    ? ScreenNames.JoinCommunityScreen 
    : ScreenNames.ChannelListScreen

  yield* put(navigationActions.replaceScreen({ 
    screen: screen 
  }))
}
