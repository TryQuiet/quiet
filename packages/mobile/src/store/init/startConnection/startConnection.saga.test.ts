import { NativeModules } from 'react-native'
import { APP_READY_CHANNEL, socket as stateManager } from '@quiet/state-manager'
import { SocketActions, SocketEvents } from '@quiet/types'
import { expectSaga } from 'redux-saga-test-plan'
import { apply, call, select } from 'redux-saga-test-plan/matchers'
import { runSaga, stdChannel } from 'redux-saga'
import { io } from 'socket.io-client'

import {
  reconcileWebsocketConnection,
  startConnectionSaga,
  subscribeSocketLifecycle,
  watchWebsocketConnection,
} from './startConnection.saga'
import { initActions, initReducer, WebsocketConnectionPayload } from '../init.slice'
import { initMasterSaga } from '../init.master.saga'
import { initSelectors } from '../init.selectors'
import { take } from 'typed-redux-saga'
import { keysActions } from '../../keys/keys.slice'
import { usersMetadataActions } from '../../userMetadata/usersMetadata.slice'

class MockSocket {
  public id = 'socket-1'
  public connected = false
  public active = false
  public connect = jest.fn(() => this)
  public disconnect = jest.fn(() => this)
  public emit = jest.fn(() => this)
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
    expect(socket.off).toHaveBeenCalledWith('connect_error')
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.KEYS_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.DEVICE_CREDENTIALS_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.USER_PROFILES_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.NSE_QSS_URL_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.NSE_SYNC_SEQ_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED)
  })

  it('buffers lifecycle actions emitted before a taker is ready', async () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    socket.trigger('connect')
    socket.trigger('disconnect', 'transport close')

    await expect(takeFromChannel(channel)).resolves.toEqual(initActions.setWebsocketConnected(socketIOData))
    await expect(takeFromChannel(channel)).resolves.toEqual(initActions.suspendWebsocketConnection())

    channel.close()
  })
})

describe('startConnectionSaga', () => {
  it('owns one socket and state-manager task across resume and ignores repeated native connection announcements', async () => {
    const sockets = [new MockSocket()]
    for (const socket of sockets) {
      socket.connect.mockImplementation(() => {
        socket.connected = true
        socket.active = true
        socket.trigger('connect')
        return socket
      })
    }
    const mockIo = io as jest.Mock
    mockIo.mockReturnValue(sockets[0])
    let activeTasks = 0
    const stateManagerTask = jest.spyOn(stateManager, 'useIO').mockImplementation(function* () {
      activeTasks++
      try {
        yield new Promise(() => undefined)
      } finally {
        activeTasks--
      }
    })
    const channel = stdChannel()
    let state = initReducer(undefined, { type: 'test/init' })
    const dispatch = (action: any) => {
      state = initReducer(state, action)
      channel.put(action)
    }
    const task = runSaga({ channel, dispatch, getState: () => ({ Init: state }) }, initMasterSaga)
    try {
      const start = initActions.startWebsocketConnection({ dataPort: 11000, socketIOSecret: 'secret' })
      dispatch(start)
      await Promise.resolve()
      dispatch(initActions.resumeWebsocketConnection())
      dispatch(initActions.resumeWebsocketConnection())
      expect(sockets[0].connect).toHaveBeenCalledTimes(1)
      expect(sockets[0].disconnect).not.toHaveBeenCalled()
      expect(activeTasks).toBe(1)

      dispatch(start)
      await Promise.resolve()
      expect(sockets[0].disconnect).not.toHaveBeenCalled()
      expect(activeTasks).toBe(1)
    } finally {
      task.cancel()
      await task.toPromise()
      stateManagerTask.mockRestore()
    }
    expect(activeTasks).toBe(0)
    expect(sockets[0].disconnect).toHaveBeenCalledTimes(1)
  })

  it('installs listeners before connecting and closes its owned socket on cancellation', async () => {
    const socket = new MockSocket()
    socket.connect.mockImplementation(() => {
      socket.connected = true
      socket.active = true
      socket.trigger('connect')
      return socket
    })
    ;(io as jest.Mock).mockReturnValue(socket)
    const stateManagerTask = jest.spyOn(stateManager, 'useIO').mockImplementation(function* () {
      yield new Promise(() => undefined)
    })
    const dispatched: unknown[] = []
    const channel = stdChannel()

    const task = runSaga(
      {
        channel,
        dispatch: action => {
          dispatched.push(action)
          channel.put(action)
        },
      },
      startConnectionSaga,
      initActions.startWebsocketConnection({ dataPort: 11000, socketIOSecret: 'secret' })
    )

    await Promise.resolve()

    expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(socket.on.mock.invocationCallOrder[0]).toBeLessThan(socket.connect.mock.invocationCallOrder[0])
    expect(dispatched).toContainEqual(initActions.setWebsocketConnected({ dataPort: 11000, socketIOSecret: 'secret' }))
    expect(stateManagerTask).toHaveBeenCalledWith(socket)
    expect(socket.emit).toHaveBeenCalledWith(SocketActions.START)

    task.cancel()
    await task.toPromise()

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
    expect(socket.off).toHaveBeenCalledWith('connect')
    expect(dispatched).toContainEqual(initActions.suspendWebsocketConnection())
    stateManagerTask.mockRestore()
  })
})

describe('reconcileWebsocketConnection', () => {
  const socketIOData: WebsocketConnectionPayload = {
    dataPort: 11000,
    socketIOSecret: 'secret',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps a healthy socket and Redux connection intact on foreground reconciliation', async () => {
    const socket = Object.assign(new MockSocket(), { connected: true, active: true })
    await expectSaga(reconcileWebsocketConnection, { socket: socket as any, socketIOData })
      .provide([[select(initSelectors.isWebsocketConnected), true]])
      .not.put.actionType(initActions.setWebsocketConnected.type)
      .not.put.actionType(initActions.suspendWebsocketConnection.type)
      .run()
    expect(socket.connect).not.toHaveBeenCalled()
    expect(socket.disconnect).not.toHaveBeenCalled()
  })

  it('reconciles Redux when the live socket is already connected', async () => {
    const socket = Object.assign(new MockSocket(), { connected: true, active: true })

    await expectSaga(reconcileWebsocketConnection, { socket: socket as any, socketIOData })
      .provide([[select(initSelectors.isWebsocketConnected), false]])
      .put(initActions.setWebsocketConnected(socketIOData))
      .not.call.fn(socket.connect)
      .run()
  })

  it('leaves an active disconnected socket to its automatic reconnect loop', async () => {
    const socket = Object.assign(new MockSocket(), { connected: false, active: true })

    await expectSaga(reconcileWebsocketConnection, { socket: socket as any, socketIOData })
      .provide([[select(initSelectors.isWebsocketConnected), true]])
      .put(initActions.suspendWebsocketConnection())
      .not.call.fn(socket.connect)
      .run()
  })

  it('restarts an inactive disconnected socket', async () => {
    const socket = Object.assign(new MockSocket(), { connected: false, active: false })

    await expectSaga(reconcileWebsocketConnection, { socket: socket as any, socketIOData })
      .provide([
        [select(initSelectors.isWebsocketConnected), false],
        [apply.fn(socket.connect), null],
      ])
      .call.fn(socket.connect)
      .run()
  })

  it('does not issue duplicate connect calls across repeated resume events', async () => {
    const socket = Object.assign(new MockSocket(), { connected: false, active: false })
    socket.connect.mockImplementation(() => {
      socket.active = true
      return socket
    })
    const connection = { socket: socket as any, socketIOData }

    await expectSaga(reconcileWebsocketConnection, connection)
      .provide([[select(initSelectors.isWebsocketConnected), false]])
      .run()
    await expectSaga(reconcileWebsocketConnection, connection)
      .provide([[select(initSelectors.isWebsocketConnected), false]])
      .run()

    expect(socket.connect).toHaveBeenCalledTimes(1)
  })

  it('requests fresh connection data from native when no socket exists', async () => {
    await expectSaga(reconcileWebsocketConnection, undefined)
      .provide([
        [select(initSelectors.isWebsocketConnected), false],
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
      ])
      .call(NativeModules.CommunicationModule.handleIncomingEvents, APP_READY_CHANNEL, null, null)
      .run()
  })

  it('clears stale Redux connection state before requesting native data', async () => {
    await expectSaga(reconcileWebsocketConnection, undefined)
      .provide([
        [select(initSelectors.isWebsocketConnected), true],
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
      ])
      .put(initActions.suspendWebsocketConnection())
      .run()
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
