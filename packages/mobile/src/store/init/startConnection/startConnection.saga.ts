import { io, Socket } from 'socket.io-client'
import { put, call, cancel, fork, takeEvery, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager } from '@quiet/state-manager'
import { encodeSecret } from '@quiet/common'
import { initActions, WebsocketConnectionPayload } from '../init.slice'
import { eventChannel } from 'redux-saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.startWebsocketConnection>['payload']>
): Generator {
  const { dataPort, socketIOSecret } = action.payload

  let _dataPort = dataPort

  if (!dataPort || dataPort === 0) {
    _dataPort = 11000
  }

  if (!socketIOSecret) return

  const token = encodeSecret(socketIOSecret)
  const socket = yield* call(io, `http://127.0.0.1:${_dataPort}`, {
    withCredentials: true,
    extraHeaders: {
      authorization: `Basic ${token}`,
    },
  })
  yield* fork(handleSocketLifecycleActions, socket, action.payload)
  // Handle opening/restoring connection
  yield* takeEvery(initActions.setWebsocketConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  const task = yield* fork(stateManager.useIO, socket)
  // Handle suspending current connection
  yield* takeEvery(initActions.suspendWebsocketConnection, cancelRootTaskSaga, task)
}

function* handleSocketLifecycleActions(socket: Socket, socketIOData: WebsocketConnectionPayload): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket, socketIOData)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket: Socket, socketIOData: WebsocketConnectionPayload) {
  let socket_id: string
  return eventChannel<
    ReturnType<typeof initActions.setWebsocketConnected> | ReturnType<typeof initActions.suspendWebsocketConnection>
  >(emit => {
    socket.on('connect', async () => {
      socket_id = socket.id
      console.log('client: Websocket connected', socket_id)
      emit(initActions.setWebsocketConnected(socketIOData))
    })
    socket.on('disconnect', () => {
      console.log('client: Closing socket connection', socket_id)
      emit(initActions.suspendWebsocketConnection())
    })
    return () => {}
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  console.log('Canceling root task')
  yield* cancel(task)
  yield* put (initActions.canceledRootTask())
}
