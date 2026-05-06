import { io } from 'socket.io-client'
import { all, fork, takeEvery, call, put, cancel, FixedTask, select, take, delay, apply } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager, messages, connection, Socket } from '@quiet/state-manager'
import { socketActions } from './socket.slice'
import { eventChannel } from 'redux-saga'
import { displayMessageNotificationSaga } from '../notifications/notifications.saga'
import { createLogger } from '../../logger'
import { SocketActions } from '@quiet/types'

const logger = createLogger('socket')

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof socketActions.startConnection>['payload']>
): Generator {
  const { dataPort, socketIOSecret } = action.payload
  if (!dataPort) {
    logger.error('About to start connection but no dataPort found')
    return
  }

  if (!socketIOSecret) {
    logger.error('About to start connection but no socketIOSecret found')
    return
  }

  logger.info('Connecting to backend')
  const socket = yield* call(io, `http://127.0.0.1:${dataPort}`, {
    withCredentials: true,
    upgrade: true,
    extraHeaders: {
      authorization: `Bearer ${socketIOSecret}`,
      Connection: 'Upgrade',
      Upgrade: 'websocket',
    },
  })
  yield* fork(handleSocketLifecycleActions, socket)

  // Handle opening/restoring connection
  yield* takeEvery(socketActions.setConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  const root = yield* fork(stateManager.useIO, socket)
  const observers = yield* fork(initObservers)

  logger.info('Frontend is ready. Starting backend...')
  yield* apply(socket, socket.emit, [SocketActions.START])

  // Handle suspending current connection
  yield all([
    takeEvery(socketActions.suspendConnection, cancelRootSaga, root),
    takeEvery(socketActions.suspendConnection, cancelObservers, observers),
  ])
}

function* handleSocketLifecycleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribeSocketLifecycle(socket?: Socket) {
  return eventChannel<
    ReturnType<typeof socketActions.setConnected> | ReturnType<typeof socketActions.suspendConnection>
  >(emit => {
    socket?.on('connect', async () => {
      logger.info('websocket connected')
      emit(socketActions.setConnected())
    })
    socket?.on('disconnect', reason => {
      logger.info('closing socket connection', reason)
      emit(socketActions.suspendConnection())
    })
    return () => {}
  })
}

function* cancelRootSaga(task: FixedTask<Generator>): Generator {
  logger.info('canceling root task')
  yield* cancel(task)
}

function* cancelObservers(task: FixedTask<Generator>): Generator {
  logger.info('canceling observers')
  yield* cancel(task)
}

function* initObservers(): Generator {
  yield all([takeEvery(messages.actions.addMessages.type, displayMessageNotificationSaga)])
}
