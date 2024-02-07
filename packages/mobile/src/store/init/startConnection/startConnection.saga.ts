import { io } from 'socket.io-client'
import { select, put, call, cancel, fork, takeEvery, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager, Socket } from '@quiet/state-manager'
import { encodeSecret } from '@quiet/common'
import { initSelectors } from '../init.selectors'
import { initActions, WebsocketConnectionPayload } from '../init.slice'
import { eventChannel } from 'redux-saga'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.startWebsocketConnection>['payload']>
): Generator {
  const isWebsocketConnected = yield* select(initSelectors.isWebsocketConnected)
  console.log('WEBSOCKET', 'Entered start connection saga', isWebsocketConnected)

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
  console.log('WEBSOCKET', 'Forking state-manager sagas', task)
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
  let socket_id: string | undefined

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
  yield* put(initActions.canceledRootTask())
}
