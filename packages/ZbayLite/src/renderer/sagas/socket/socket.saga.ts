import { io, Socket } from 'socket.io-client'
import { fork, takeEvery, call, put, select, cancel, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as nectar } from '@zbayapp/nectar'
import { socketActions } from './socket.slice'
import { socketSelectors } from './socket.selectors'
import { eventChannel } from 'redux-saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof socketActions.startConnection>['payload']>
): Generator {
  const isConnected = yield* select(socketSelectors.isConnected)
  if (isConnected) return
  const socket = yield* call(connect, action.payload.dataPort)
  const task = yield* fork(nectar.useIO, socket)
  yield* put(socketActions.setConnected())
  // Detach sagas and close websocket connection on reload
  yield* fork(handleSocketLifecycleActions, socket)
  yield* takeEvery(socketActions.closeConnection, cancelRootTaskSaga, task)
}

export const connect = async (dataPort: number): Promise<Socket> => {
  console.log('starting websocket connection')
  const socket = io(`http://localhost:${dataPort}`)
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      resolve(socket)
    })
  })
}

function* handleSocketLifecycleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket: Socket) {
  return eventChannel<ReturnType<typeof socketActions.closeConnection>>(emit => {
    socket.on('disconnect', () => {
      console.log('closing socket connection')
      socket.close()
      emit(socketActions.closeConnection())
    })
    return () => {}
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  console.log('canceling root task')
  yield* cancel(task)
}
