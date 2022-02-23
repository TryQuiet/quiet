import { io, Socket } from 'socket.io-client'
import { put, call, cancel, fork, takeEvery, FixedTask } from 'typed-redux-saga'
import { eventChannel } from 'redux-saga'
import { socket as nectar } from '@quiet/nectar'
import { PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { initActions } from '../init.slice'
import { initialRoutingSaga } from '../initialRouting/initialRouting.saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.startConnection>['payload']>
): Generator {
  const dataPort = action.payload.dataPort

  const socket = yield* call(io, `http://localhost:${dataPort}`)
  yield* fork(handleSocketLifecycleActions, socket)

  // Handle opening/restoring connection
  yield* takeEvery(initActions.setConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  // @ts-expect-error
  const task = yield* fork(nectar.useIO, socket)
  // Screen redirection
  yield* fork(initialRoutingSaga)
  // Handle suspending current connection
  yield* takeEvery(initActions.suspendConnection, cancelRootTaskSaga, task)
}

function* handleSocketLifecycleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket: Socket) {
  return eventChannel<
  ReturnType<typeof initActions.setConnected> |
  ReturnType<typeof initActions.suspendConnection>
  >(emit => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      emit(initActions.setConnected())
    })
    socket.on('disconnect', () => {
      console.log('closing socket connection')
      emit(initActions.suspendConnection())
    })
    return () => {}
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  console.log('canceling root task')
  yield* cancel(task)
}
