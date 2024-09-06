import { io } from 'socket.io-client'
import {
  select,
  put,
  putResolve,
  call,
  cancel,
  fork,
  take,
  takeLeading,
  takeEvery,
  FixedTask,
  apply,
} from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager, Socket } from '@quiet/state-manager'
import { encodeSecret } from '@quiet/common'
import { initSelectors } from '../init.selectors'
import { initActions, WebsocketConnectionPayload } from '../init.slice'
import { eventChannel } from 'redux-saga'
import { SocketActionTypes } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('startConnection')

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof initActions.startWebsocketConnection>['payload']>
): Generator {
  const { dataPort, socketIOSecret } = action.payload

  logger.info(`Starting connection saga on dataPort: ${dataPort}`)

  let _dataPort = dataPort

  if (!dataPort || dataPort === 0) {
    _dataPort = 11000
  }

  if (!socketIOSecret) {
    logger.error('Missing IO secret')
    return
  }

  logger.info('Connecting to backend')
  const token = encodeSecret(socketIOSecret)
  const socket = yield* call(io, `http://127.0.0.1:${_dataPort}`, {
    withCredentials: true,
    extraHeaders: {
      authorization: `Basic ${token}`,
    },
  })
  yield* fork(handleSocketLifecycleActions, socket, action.payload)
  // Handle opening/restoring connection
  yield* takeLeading(initActions.setWebsocketConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  logger.info('Frontend is ready. Forking state-manager sagas and starting backend...')

  const task = yield* fork(stateManager.useIO, socket)

  // @ts-ignore - Why is this broken?
  yield* apply(socket, socket.emit, [SocketActionTypes.START])

  // Handle suspending current connection
  yield* take(initActions.suspendWebsocketConnection)
  yield* call(cancelRootTaskSaga, task)
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
      logger.info('client: Websocket connected', socket_id)
      emit(initActions.setWebsocketConnected(socketIOData))
    })
    socket.on('disconnect', reason => {
      logger.warn('client: Closing socket connection', socket_id, reason)
      emit(initActions.suspendWebsocketConnection())
    })
    return () => {}
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  logger.warn('Canceling root task', task.error())
  yield* cancel(task)
  yield* putResolve(initActions.canceledRootTask())
}
