import { PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { navigationActions } from '../navigation.slice'
import { navigate } from '../../../RootNavigation'

export function* navigationSaga(
  action: PayloadAction<ReturnType<typeof navigationActions.navigation>['payload']>
): Generator {
  const { screen, params } = action.payload
  yield* call(navigate, screen, params)
}
