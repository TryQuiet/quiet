import { PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { NativeModules } from 'react-native'
import { call } from 'typed-redux-saga'
import { initActions } from '../../init/init.slice'

export function* saveDataPortSaga(action: PayloadAction<ReturnType<typeof initActions.onBackendStarted>['payload']>): Generator {
  const { dataPort } = action.payload
  yield* call(NativeModules.BackendModule.saveDataPort, dataPort)
}
