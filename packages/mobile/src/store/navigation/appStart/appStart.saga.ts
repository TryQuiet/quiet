import { NavigationContainerRef } from '@react-navigation/native'
import { select, call } from 'typed-redux-saga'
import { identity } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { replaceScreen } from '../../../RootNavigation'

export function* appStartSaga(navigationContainer: NavigationContainerRef): Generator {
  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  const screen = !currentIdentity?.userCertificate 
    ? ScreenNames.JoinCommunityScreen 
    : ScreenNames.ChannelListScreen

  yield* call(replaceScreen, navigationContainer, screen)
}
