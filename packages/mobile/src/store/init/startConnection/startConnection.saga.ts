import { io } from 'socket.io-client'
import { NativeModules, Platform } from 'react-native'
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
import type { Task } from 'redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { communities, socket as stateManager, Socket } from '@quiet/state-manager'
import { initActions, WebsocketConnectionPayload } from '../init.slice'
import { eventChannel } from 'redux-saga'
import {
  DeviceCredentialsUpdatedEvent,
  KeysUpdatedEvent,
  NseQssUrlUpdatedEvent,
  NseSyncSeqUpdatedEvent,
  SocketActions,
  SocketEvents,
  UserProfilesUpdatedPayload,
  type MobileChannelMetadataUpdatedPayload,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { keysActions } from '../../keys/keys.slice'
import { usersMetadataActions } from '../../userMetadata/usersMetadata.slice'
import { channelMetadataActions } from '../../channelMetadata/channelMetadata.slice'

const logger = createLogger('startConnection')

const isSameBackend = (a: WebsocketConnectionPayload, b: WebsocketConnectionPayload): boolean =>
  a.dataPort === b.dataPort && a.socketIOSecret === b.socketIOSecret

/**
 * Starts the backend websocket connection and everything forked under it, once per
 * backend.
 *
 * The native layer can emit startWebsocketConnection more than once for the same
 * backend, e.g. twice within a second on a cold start with a deep link. This used to
 * be wired with takeLatest, so every repeat cancelled the running connection saga and
 * with it the state-manager root task and all master sagas, including an onboarding
 * (join) saga in flight; the username and terms screens then dispatched into a void
 * and the join spun forever (#347).
 *
 * A repeat for the same data port and secret is now ignored while the connection task
 * is still running (that task already survives socket reconnects on its own). A
 * different port or secret means a new backend, and only then is the old tree torn
 * down and rebuilt.
 */
export function* watchWebsocketConnection(
  connect: (action: PayloadAction<WebsocketConnectionPayload>) => Generator = startConnectionSaga
): Generator {
  let active: { payload: WebsocketConnectionPayload; task: Task } | undefined

  while (true) {
    const action = (yield* take(initActions.startWebsocketConnection.type)) as PayloadAction<WebsocketConnectionPayload>

    if (active?.task.isRunning()) {
      if (isSameBackend(active.payload, action.payload)) {
        logger.info(
          `Ignoring repeated startWebsocketConnection for the same backend on dataPort: ${action.payload.dataPort}`
        )
        continue
      }
      logger.info('Backend connection details changed, restarting the connection saga')
      yield* cancel(active.task)
    }

    const task = yield* fork(connect, action)
    active = { payload: action.payload, task }
  }
}

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
  const socket = yield* call(io, `http://127.0.0.1:${_dataPort}`, {
    withCredentials: true,
    extraHeaders: {
      authorization: `Bearer ${socketIOSecret}`,
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
  yield* apply(socket, socket.emit, [SocketActions.START])

  // Handle suspending current connection
  yield* take(initActions.suspendWebsocketConnection)
  yield* call(cancelRootTaskSaga, task)
}

function* handleSocketLifecycleActions(socket: Socket, socketIOData: WebsocketConnectionPayload): Generator {
  const socketChannel = yield* call(subscribeSocketLifecycle, socket, socketIOData)
  try {
    yield takeEvery(socketChannel, function* (action) {
      yield put(action)
    })
  } finally {
    socketChannel.close()
  }
}

export function subscribeSocketLifecycle(socket: Socket, socketIOData: WebsocketConnectionPayload) {
  let socket_id: string | undefined

  return eventChannel<
    | ReturnType<typeof initActions.setWebsocketConnected>
    | ReturnType<typeof initActions.suspendWebsocketConnection>
    | ReturnType<typeof keysActions.saveKeysInKeychain>
    | ReturnType<typeof keysActions.saveDeviceCredentials>
    | ReturnType<typeof usersMetadataActions.saveUserMetadataNatively>
    | ReturnType<typeof channelMetadataActions.saveChannelMetadataInKeychain>
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
    socket.on(SocketEvents.KEYS_UPDATED, async (payload: KeysUpdatedEvent) => {
      logger.info('Keys updated, writing to keychain')
      emit(keysActions.saveKeysInKeychain(payload))
    })
    socket.on(SocketEvents.DEVICE_CREDENTIALS_UPDATED, async (payload: DeviceCredentialsUpdatedEvent) => {
      logger.info('Device credentials updated, writing to keychain')
      emit(keysActions.saveDeviceCredentials(payload))
    })
    socket.on(SocketEvents.USER_PROFILES_UPDATED, async (payload: UserProfilesUpdatedPayload) => {
      logger.info('User profiles updated, saving in ios native storage')
      emit(usersMetadataActions.saveUserMetadataNatively(payload))
    })
    socket.on(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED, async (payload: MobileChannelMetadataUpdatedPayload) => {
      logger.info('Channel metadata updated, writing to keychain')
      emit(channelMetadataActions.saveChannelMetadataInKeychain(payload))
    })
    socket.on(SocketEvents.NSE_QSS_URL_UPDATED, async (payload: NseQssUrlUpdatedEvent) => {
      logger.info(`NSE QSS URL updated for team ${payload.teamId}, saving in shared iOS storage`)
      try {
        await NativeModules.CommunicationModule?.saveNseQssUrl?.(payload.teamId, payload.qssUrl, payload.qssServerId)
      } catch (error) {
        logger.error('Failed to store NSE QSS URL in iOS native storage', error)
      }
    })
    socket.on(SocketEvents.NSE_SYNC_SEQ_UPDATED, async (payload: NseSyncSeqUpdatedEvent) => {
      logger.info(`NSE sync seq updated for team ${payload.teamId}, saving in shared iOS storage`)
      try {
        await NativeModules.CommunicationModule?.saveNseLastSyncSeq?.(payload.teamId, payload.lastSyncSeq)
      } catch (error) {
        logger.error('Failed to store NSE sync seq in iOS native storage', error)
      }
    })
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off(SocketEvents.KEYS_UPDATED)
      socket.off(SocketEvents.DEVICE_CREDENTIALS_UPDATED)
      socket.off(SocketEvents.USER_PROFILES_UPDATED)
      socket.off(SocketEvents.NSE_QSS_URL_UPDATED)
      socket.off(SocketEvents.NSE_SYNC_SEQ_UPDATED)
      socket.off(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED)
    }
  })
}

function* cancelRootTaskSaga(task: FixedTask<Generator>): Generator {
  logger.warn('Canceling root task', task.error())
  yield* cancel(task)
  yield* putResolve(initActions.canceledRootTask())
}

function* syncCurrentQssEnabledToNative(): Generator {
  if (Platform.OS !== 'android') {
    return
  }

  const setTeamQssEnabled = NativeModules.CommunicationModule?.setTeamQssEnabled
  if (!setTeamQssEnabled) {
    return
  }

  const currentCommunity = yield* select(communities.selectors.currentCommunity)
  const enabled = currentCommunity?.qssEnabled === true

  try {
    yield* call(setTeamQssEnabled, enabled)
  } catch (error) {
    logger.error('Failed to sync current community qssEnabled to Android native storage', error)
  }
}

export function* watchAndSyncQssEnabledToNative(): Generator {
  yield* call(syncCurrentQssEnabledToNative)
  yield* takeEvery(communities.actions.setCurrentCommunity.type, syncCurrentQssEnabledToNative)
  yield* takeEvery(communities.actions.updateCommunityData.type, syncCurrentQssEnabledToNative)
  yield* takeEvery(communities.actions.deleteCommunity.type, syncCurrentQssEnabledToNative)
}
