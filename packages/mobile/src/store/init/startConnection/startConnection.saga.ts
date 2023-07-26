import { io, Socket } from 'socket.io-client'
import { put, call, cancel, fork, takeEvery, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { eventChannel } from 'redux-saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.startWebsocketConnection>['payload']>
): Generator {
  const { dataPort } = action.payload

  const socket = yield* call(io, `http://127.0.0.1:${dataPort}`)
  yield* fork(handleSocketLifecycleActions, socket, dataPort)

  // Handle opening/restoring connection
  yield* takeEvery(initActions.setWebsocketConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  const task = yield* fork(stateManager.useIO, socket)
  // Handle suspending current connection
  yield* takeEvery(initActions.suspendWebsocketConnection, cancelRootTaskSaga, task)
}

function* handleSocketLifecycleActions(socket: Socket, dataPort: number): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket, dataPort)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket: Socket, dataPort: number) {
  return eventChannel<
    ReturnType<typeof initActions.setWebsocketConnected> | ReturnType<typeof initActions.suspendWebsocketConnection>
  >(emit => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      emit(
        initActions.setWebsocketConnected({
          dataPort,
        })
      )
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
  yield* put(initActions.setReady(false))
}
