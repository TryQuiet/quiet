import { call, select } from 'typed-redux-saga'
import { replaceScreen } from '../../../RootNavigation'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationSelectors } from '../navigation.selectors'

export function* redirectionSaga(): Generator {
    const currentScreen = yield* select(navigationSelectors.currentScreen)
    if (currentScreen !== ScreenNames.SplashScreen) {
      yield* call(replaceScreen, currentScreen, {})
    }
}
