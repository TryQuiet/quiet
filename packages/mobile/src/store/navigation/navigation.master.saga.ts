import { PayloadAction } from '@reduxjs/toolkit'
import { all, call, takeEvery } from 'typed-redux-saga'
import { navigationActions } from './navigation.slice'
import { navigate } from '../../RootNavigation'

export function* navigationMasterSaga(): Generator {
    yield all([
        takeEvery(navigationActions.replaceScreen.type, replaceScreenSaga),
    ])
}

export function* replaceScreenSaga(action: PayloadAction<ReturnType<typeof navigationActions.replaceScreen>['payload']>): Generator {
    const { screen, params } = action.payload
    yield* call(navigate, screen, params)
}
