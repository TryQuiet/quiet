import { PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { navigationActions } from '../navigation.slice'
import { pop } from '../../../RootNavigation'

export function* popSaga(_action: PayloadAction<ReturnType<typeof navigationActions.pop>['payload']>): Generator {
    yield* call(pop)
}
