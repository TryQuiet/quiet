import { io, Socket } from 'socket.io-client'
import { all, fork, takeEvery, call, put, cancel, FixedTask } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as stateManager, messages } from '@quiet/state-manager'
import { socketActions } from './socket.slice'
import { eventChannel } from 'redux-saga'
import { displayMessageNotificationSaga } from '../notifications/notifications.saga'
import logger from '../../logger'
const log = logger('socket')

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof socketActions.startConnection>['payload']>
): Generator {
  const dataPort = action.payload.dataPort
  if (!dataPort) {
    log.error('About to start connection but no dataPort found')
  }
  const socket = yield* call(io, `http://127.0.0.1:${dataPort}`)
  yield* fork(handleSocketLifecycleActions, socket)

  // Handle opening/restoring connection
  yield* takeEvery(socketActions.setConnected, setConnectedSaga, socket)
}

function* setConnectedSaga(socket: Socket): Generator {
  // @ts-expect-error
  const root = yield* fork(stateManager.useIO, socket)
  const observers = yield* fork(initObservers)
  // Handle suspending current connection
  yield all([
    takeEvery(socketActions.suspendConnection, cancelRootSaga, root),
    takeEvery(socketActions.suspendConnection, cancelObservers, observers)
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
  ReturnType<typeof socketActions.setConnected> |
  ReturnType<typeof socketActions.suspendConnection>
  >(emit => {
    socket?.on('connect', async () => {
      console.log('websocket connected')
      emit(socketActions.setConnected())
    })
    socket?.on('disconnect', () => {
      console.log('closing socket connection')
      emit(socketActions.suspendConnection())
    })
    return () => {}
  })
}

function* cancelRootSaga(task: FixedTask<Generator>): Generator {
  console.log('canceling root task')
  yield* cancel(task)
}

function* cancelObservers(task: FixedTask<Generator>): Generator {
  console.log('canceling observers')
  yield* cancel(task)
}

function* initObservers(): Generator {
  yield all([
    takeEvery(messages.actions.incomingMessages.type, displayMessageNotificationSaga)
  ])
}
