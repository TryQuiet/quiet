import { NavigationContainerRef, StackActions } from '@react-navigation/native'

import { ScreenNames } from './const/ScreenNames.enum'

export const navigate = <Params extends {}>(
  navigationContainer: NavigationContainerRef,
  screen: ScreenNames,
  params?: Params
): void => {
  navigationContainer.navigate(screen, params)
}

export const replaceScreen = <Params extends {}>(
  navigationContainer: NavigationContainerRef,
  screen: ScreenNames,
  params?: Params
): void => {
  navigationContainer.dispatch(
    StackActions.replace(screen, params),
  )
}
