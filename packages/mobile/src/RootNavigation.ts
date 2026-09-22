import { CommonActions, createNavigationContainerRef, StackActions } from '@react-navigation/native'

import { ScreenNames } from './const/ScreenNames.enum'
import { RootStackParamList } from './route.params'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navigate = <Params extends Record<string, unknown>>(screen: ScreenNames, params?: Params): void => {
  if (navigationRef.isReady()) {
    // Back buttons also use this helper to return to an existing screen. In
    // React Navigation 7, popping that screen's successors must be explicit.
    navigationRef.dispatch(CommonActions.navigate(screen, params, { pop: true }))
  }
}

export const replaceScreen = <Params extends Record<string, unknown>>(screen: ScreenNames, params?: Params): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(screen, params))
  }
}

export const pop = (): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.pop())
  }
}

export const resetToScreen = (screen: ScreenNames): void => {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({ index: 0, routes: [{ name: screen }] })
  }
}

/**
 * Reset to a whole path rather than a single screen: the last entry is shown and
 * the ones before it are what its back arrow retraces. Used when Redux state has
 * been wiped underneath the navigator and the stack has to be rebuilt to match.
 */
export const resetToStack = (screens: ScreenNames[]): void => {
  if (navigationRef.isReady() && screens.length > 0) {
    navigationRef.resetRoot({ index: screens.length - 1, routes: screens.map(name => ({ name })) })
  }
}
