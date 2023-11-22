import { PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { navigationActions } from '../navigation.slice'
import { replaceScreen } from '../../../RootNavigation'

export function* replaceScreenSaga(
    action: PayloadAction<ReturnType<typeof navigationActions.replaceScreen>['payload']>
): Generator {
    const { screen, params } = action.payload
    yield* call(replaceScreen, screen, params)
}
