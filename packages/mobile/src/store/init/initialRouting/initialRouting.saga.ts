import { select, call } from 'typed-redux-saga'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen'
import { communities } from '@quiet/nectar'

export function* initialRoutingSaga(): Generator {
  const community = yield* select(communities.selectors.currentCommunity)
  const screen = !community ? ScreenNames.JoinCommunityScreen : ScreenNames.MainScreen
  yield* call(replaceScreen, screen)
}
