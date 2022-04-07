import { io, Socket } from 'socket.io-client'
import { fork, takeEvery, call, put, cancel, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as nectar } from '@quiet/nectar'
import { socketActions } from './socket.slice'
import { eventChannel } from 'redux-saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof socketActions.startConnection>['payload']>
): Generator {
  const dataPort = action.payload.dataPort
  console.log('startConnectionSaga', dataPort)
  const socket = yield* call(io, `http://localhost:${dataPort}`)
  console.log('startConnectionSaga after call', dataPort)
  yield* fork(handleSocketLifecycleActions, socket)

  // Handle opening/restoring connection
  yield* takeEvery(socketActions.setConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  const task = yield* fork(nectar.useIO, socket)
  // Handle suspending current connection
  yield* takeEvery(socketActions.suspendConnection, cancelRootTaskSaga, task)
}

function* handleSocketLifecycleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket: Socket) {
  return eventChannel<
  ReturnType<typeof socketActions.setConnected> |
  ReturnType<typeof socketActions.suspendConnection>
  >(emit => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      emit(socketActions.setConnected())
    })
    socket.on('disconnect', () => {
      console.log('closing socket connection')
      emit(socketActions.suspendConnection())
    })
    return () => {}
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  console.log('canceling root task')
  yield* cancel(task)
}
