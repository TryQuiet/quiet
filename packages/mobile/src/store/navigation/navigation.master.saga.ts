import { NavigationContainerRef } from '@react-navigation/native'
import { PayloadAction } from '@reduxjs/toolkit'
import { all, call, takeEvery, takeLeading } from 'typed-redux-saga'
import { navigationActions } from './navigation.slice'
import { navigate, replaceScreen } from '../../RootNavigation'
import { appStartSaga } from './appStart/appStart.saga'
import { initActions } from '../init/init.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

export function* navigationMasterSaga(): Generator {
    yield all([
        takeEvery(navigationActions.navigationReady.type, handleNavigation),
    ])
}

export function* handleNavigation(action: PayloadAction<ReturnType<typeof navigationActions.navigationReady>['payload']>): Generator {
    console.log('handle navigation')
    const { navigationContainer } = action.payload

    // Display splash screen as soon as navigation container is ready
    yield* call(navigate, navigationContainer, ScreenNames.SplashScreen)

    yield all([
        takeEvery(navigationActions.replaceScreen.type, replaceScreenSaga, navigationContainer),
        // Redirect to either channel list or community joining screen when websocket connects
        takeLeading(initActions.setWebsocketConnected, appStartSaga, navigationContainer)
    ])
}

export function* replaceScreenSaga(navigationContainer: NavigationContainerRef, action: PayloadAction<ReturnType<typeof navigationActions.replaceScreen>['payload']>): Generator {
    const { screen, params } = action.payload
    yield* call(replaceScreen, navigationContainer, screen, params)
}
