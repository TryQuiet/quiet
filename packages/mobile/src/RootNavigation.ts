import { createNavigationContainerRef, StackActions } from '@react-navigation/native'

import { ScreenNames } from './const/ScreenNames.enum'

export const navigationRef = createNavigationContainerRef()

export const navigate = <Params extends Record<string, unknown>>(screen: ScreenNames, params?: Params): void => {
    if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.navigate(screen, params)
    }
}

export const replaceScreen = <Params extends Record<string, unknown>>(screen: ScreenNames, params?: Params): void => {
    if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.dispatch(StackActions.replace(screen, params))
    }
}

export const pop = (): void => {
    if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.dispatch(StackActions.pop())
    }
}
