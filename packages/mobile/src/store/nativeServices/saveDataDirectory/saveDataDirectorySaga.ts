import { PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { NativeModules } from 'react-native'
import { call } from 'typed-redux-saga'
import { initActions } from '../../init/init.slice'

export function* saveDataDirectorySaga(action: PayloadAction<ReturnType<typeof initActions.onDataDirectoryCreated>['payload']>): Generator {
  yield* call(NativeModules.BackendModule.saveDataDirectoryPath, action.payload)
}
