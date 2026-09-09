import { CommonActions, createNavigationContainerRef, StackActions } from '@react-navigation/native'

import { ScreenNames } from './const/ScreenNames.enum'
import { RootStackParamList } from './route.params'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navigate = <Params extends Record<string, unknown>>(screen: ScreenNames, params?: Params): void => {
  if (navigationRef.isReady()) {
    // Back buttons also use this helper to return to an existing screen. In
    // React Navigation 7, popping that screen's successors must be explicit.
    navigationRef.dispatch(CommonActions.navigate({ name: screen, params, pop: true }))
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
