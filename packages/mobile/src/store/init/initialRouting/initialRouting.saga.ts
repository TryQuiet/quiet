import { select, call } from 'typed-redux-saga'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen'
import { identity } from '@quiet/state-manager'

export function* initialRoutingSaga(): Generator {
  const currentIdentity = yield* select(identity.selectors.currentIdentity)
  const screen = !currentIdentity?.userCertificate ? ScreenNames.JoinCommunityScreen : ScreenNames.ChannelListScreen
  yield* call(replaceScreen, screen)
}
