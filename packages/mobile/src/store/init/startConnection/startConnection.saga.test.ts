import { NativeModules } from 'react-native'
import { SocketEvents } from '@quiet/types'

import { runSaga, stdChannel } from 'redux-saga'
import { take } from 'typed-redux-saga'
import { subscribeSocketLifecycle, watchWebsocketConnection } from './startConnection.saga'
import { initActions, WebsocketConnectionPayload } from '../init.slice'
import { keysActions } from '../../keys/keys.slice'
import { usersMetadataActions } from '../../userMetadata/usersMetadata.slice'

class MockSocket {
  public id = 'socket-1'
  private readonly handlers: Map<string, Set<(...args: any[]) => void>> = new Map()

  public on = jest.fn((event: string, handler: (...args: any[]) => void) => {
    const existing = this.handlers.get(event) ?? new Set()
    existing.add(handler)
    this.handlers.set(event, existing)
    return this
  })

  public off = jest.fn((event: string) => {
    this.handlers.delete(event)
    return this
  })

  public trigger(event: string, ...args: any[]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      void handler(...args)
    }
  }
}

const takeFromChannel = <T>(channel: { take: (callback: (input: T) => void) => void }): Promise<T> =>
  new Promise(resolve => {
    channel.take(resolve)
  })

describe('subscribeSocketLifecycle', () => {
  const socketIOData: WebsocketConnectionPayload = {
    dataPort: 11000,
    socketIOSecret: 'secret',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps socket lifecycle and NSE events to mobile actions', async () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    const connected = takeFromChannel(channel)
    socket.trigger('connect')
    await expect(connected).resolves.toEqual(initActions.setWebsocketConnected(socketIOData))

    const keysUpdatedPayload = { keys: [{ keyName: 'quiet_team_secret', key: 'secret-key' }] }
    const keysUpdated = takeFromChannel(channel)
    socket.trigger(SocketEvents.KEYS_UPDATED, keysUpdatedPayload)
    await expect(keysUpdated).resolves.toEqual(keysActions.saveKeysInKeychain(keysUpdatedPayload))

    const credentialsPayload = {
      deviceId: 'device-id',
      userId: 'self-id',
      teamId: 'team-id',
      signingPrivateKey: 'private-signing-key',
    }
    const credentialsUpdated = takeFromChannel(channel)
    socket.trigger(SocketEvents.DEVICE_CREDENTIALS_UPDATED, credentialsPayload)
    await expect(credentialsUpdated).resolves.toEqual(keysActions.saveDeviceCredentials(credentialsPayload))

    const userProfilesPayload = {
      new: [{ userId: 'new-user', nickname: 'Alice' }],
      updates: [{ userId: 'updated-user', nickname: 'Bob' }],
    }
    const userProfilesUpdated = takeFromChannel(channel)
    socket.trigger(SocketEvents.USER_PROFILES_UPDATED, userProfilesPayload)
    await expect(userProfilesUpdated).resolves.toEqual(
      usersMetadataActions.saveUserMetadataNatively(userProfilesPayload)
    )

    const disconnected = takeFromChannel(channel)
    socket.trigger('disconnect', 'transport close')
    await expect(disconnected).resolves.toEqual(initActions.suspendWebsocketConnection())

    channel.close()
  })

  it('stores NSE QSS url and sync seq in native shared storage', async () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    socket.trigger(SocketEvents.NSE_QSS_URL_UPDATED, {
      teamId: 'team-id',
      qssUrl: 'https://community.example',
      qssServerId: 'qss-server-id',
    })
    await Promise.resolve()

    expect(NativeModules.CommunicationModule.saveNseQssUrl).toHaveBeenCalledWith(
      'team-id',
      'https://community.example',
      'qss-server-id'
    )

    socket.trigger(SocketEvents.NSE_SYNC_SEQ_UPDATED, {
      teamId: 'team-id',
      lastSyncSeq: 42,
    })
    await Promise.resolve()

    expect(NativeModules.CommunicationModule.saveNseLastSyncSeq).toHaveBeenCalledWith('team-id', 42)

    channel.close()
  })

  it('unsubscribes all registered listeners when the channel closes', () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    channel.close()

    expect(socket.off).toHaveBeenCalledWith('connect')
    expect(socket.off).toHaveBeenCalledWith('disconnect')
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.KEYS_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.DEVICE_CREDENTIALS_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.USER_PROFILES_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.NSE_QSS_URL_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.NSE_SYNC_SEQ_UPDATED)
  })
})

// Regression (#347): the native layer can emit startWebsocketConnection twice for the
// same backend during a cold start with a deep link. With takeLatest the repeat
// cancelled the whole saga tree, including an in-flight join saga.
describe('watchWebsocketConnection', () => {
  const backendA: WebsocketConnectionPayload = { dataPort: 11000, socketIOSecret: 'secret-a' }
  const backendB: WebsocketConnectionPayload = { dataPort: 11000, socketIOSecret: 'secret-b' }
  const tick = () => new Promise(resolve => setImmediate(resolve))

  const makeConnect = () => {
    const started: WebsocketConnectionPayload[] = []
    const cancelled: WebsocketConnectionPayload[] = []
    function* connect(action: { payload: WebsocketConnectionPayload }): Generator {
      started.push(action.payload)
      try {
        // A real connection saga blocks here for the life of the backend connection.
        yield* take('never')
      } finally {
        cancelled.push(action.payload)
      }
    }
    return { connect, started, cancelled }
  }

  const runWatcher = (connect: (action: { payload: WebsocketConnectionPayload }) => Generator) => {
    const channel = stdChannel()
    const task = runSaga(
      { channel, dispatch: (action: unknown) => channel.put(action as { type: string }), getState: () => ({}) },
      watchWebsocketConnection as any,
      connect
    )
    return { task, dispatch: (action: { type: string }) => channel.put(action) }
  }

  it('starts the connection once for repeated events describing the same backend', async () => {
    const { connect, started, cancelled } = makeConnect()
    const { task, dispatch } = runWatcher(connect)

    dispatch(initActions.startWebsocketConnection(backendA))
    dispatch(initActions.startWebsocketConnection(backendA))
    dispatch(initActions.startWebsocketConnection({ ...backendA }))
    await tick()

    expect(started).toEqual([backendA])
    expect(cancelled).toEqual([])
    task.cancel()
  })

  it('tears the running connection down and starts a new one when the backend changes', async () => {
    const { connect, started, cancelled } = makeConnect()
    const { task, dispatch } = runWatcher(connect)

    dispatch(initActions.startWebsocketConnection(backendA))
    await tick()
    dispatch(initActions.startWebsocketConnection(backendB))
    await tick()

    expect(started).toEqual([backendA, backendB])
    expect(cancelled).toEqual([backendA])
    task.cancel()
  })

  it('starts again for the same backend once the previous connection task has ended', async () => {
    const started: WebsocketConnectionPayload[] = []
    // eslint-disable-next-line require-yield
    function* connect(action: { payload: WebsocketConnectionPayload }): Generator {
      started.push(action.payload)
      // Returns immediately: the task is no longer running when the next event arrives.
    }
    const { task, dispatch } = runWatcher(connect)

    dispatch(initActions.startWebsocketConnection(backendA))
    await tick()
    dispatch(initActions.startWebsocketConnection(backendA))
    await tick()

    expect(started).toEqual([backendA, backendA])
    task.cancel()
  })
})
