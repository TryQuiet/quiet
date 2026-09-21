import { PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { navigationActions } from '../navigation.slice'
import { replaceScreen, resetToScreen } from '../../../RootNavigation'

export function* replaceScreenSaga(
  action: PayloadAction<ReturnType<typeof navigationActions.replaceScreen>['payload']>
): Generator {
  const { screen, params } = action.payload
  yield* call(replaceScreen, screen, params)
}

export function* resetToScreenSaga(
  action: PayloadAction<ReturnType<typeof navigationActions.resetToScreen>['payload']>
): Generator {
  yield* call(resetToScreen, action.payload.screen)
}
