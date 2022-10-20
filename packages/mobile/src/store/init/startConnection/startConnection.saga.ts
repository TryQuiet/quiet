import { io, Socket } from 'socket.io-client'
import { put, call, cancel, fork, takeEvery, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { initialRoutingSaga } from '../initialRouting/initialRouting.saga'
import { eventChannel } from 'redux-saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.startWebsocketConnection>['payload']>
): Generator {
  const dataPort = action.payload.dataPort

  const socket = yield* call(io, `http://localhost:${dataPort}`)
  yield* fork(handleSocketLifecycleActions, socket)

  // Handle opening/restoring connection
  yield* takeEvery(initActions.setWebsocketConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  // @ts-expect-error
  const task = yield* fork(stateManager.useIO, socket)
  // Screen redirection
  yield* fork(initialRoutingSaga)
  // Handle suspending current connection
  yield* takeEvery(initActions.suspendWebsocketConnection, cancelRootTaskSaga, task)
}

function* handleSocketLifecycleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket: Socket) {
  return eventChannel<
  ReturnType<typeof initActions.setWebsocketConnected> |
  ReturnType<typeof initActions.suspendWebsocketConnection>
  >(emit => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      emit(initActions.setWebsocketConnected())
    })
    socket.on('disconnect', () => {
      console.log('closing socket connection')
      emit(initActions.suspendWebsocketConnection())
    })
    return () => {}
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  console.log('canceling root task')
  yield* cancel(task)
}
