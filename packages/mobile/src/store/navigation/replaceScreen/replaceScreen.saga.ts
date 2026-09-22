import { PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'
import { navigationActions } from '../navigation.slice'
import { replaceScreen, resetToScreen, resetToStack } from '../../../RootNavigation'

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

export function* resetToStackSaga(
  action: PayloadAction<ReturnType<typeof navigationActions.resetToStack>['payload']>
): Generator {
  yield* call(resetToStack, action.payload.screens)
}
