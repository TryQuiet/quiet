import { io, Socket } from 'socket.io-client'
import { put, call, fork } from 'typed-redux-saga'
import { socket } from '@quiet/nectar'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen'
import { nativeServicesActions } from '../../nativeServices/nativeServices.slice'
import { PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { initActions } from '../init.slice'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.onWaggleStarted>['payload']>
): Generator {
  const _socket = yield* call(connect, action.payload)
  // There is a type-specific problem with passing Socket object between this saga and @quiet/nectar
  // @ts-expect-error
  yield* fork(socket.useIO, _socket)
  //
  yield* put(nativeServicesActions.initPushNotifications())
  //
  yield* call(replaceScreen, ScreenNames.MainScreen)
}

export const connect = async (dataPort: number): Promise<Socket> => {
  const socket = io(`http://127.0.0.1:${dataPort}`)
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      resolve(socket)
    })
  })
}
