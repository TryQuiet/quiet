import { createServer } from 'http'
import type { Socket as TcpSocket } from 'net'
import { NativeModules } from 'react-native'
import { runSaga, stdChannel } from 'redux-saga'
import { io } from 'socket.io-client'
import { Server } from 'socket.io'
import { communities, socket as stateManager } from '@quiet/state-manager'
import { getValidInvitationUrlTestData, validInvitationDatav4 } from '@quiet/common'
import { initMasterSaga } from '../store/init/init.master.saga'
import { initActions } from '../store/init/init.slice'
import { RECOVER_WEBSOCKET_CHANNEL } from '../store/init/startConnection/startConnection.saga'
import { allReducers } from '../store/root.reducer'

const realIo = jest.requireActual('socket.io-client').io as typeof io
const tick = () => new Promise(resolve => setTimeout(resolve, 10))
const waitUntil = async (condition: () => boolean) => {
  for (let attempt = 0; attempt < 500 && !condition(); attempt++) await tick()
  expect(condition()).toBe(true)
}

const createBackend = async (secret: string) => {
  const http = createServer()
  const tcp = new Set<TcpSocket>()
  http.on('connection', socket => {
    tcp.add(socket)
    socket.on('close', () => tcp.delete(socket))
  })
  const server = new Server(http)
  server.use((socket, next) => {
    next(socket.handshake.headers.authorization === `Bearer ${secret}` ? undefined : new Error('Unauthorized'))
  })
  const connect = jest.fn()
  server.on('connection', connect)
  await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve))
  const port = (http.address() as { port: number }).port
  return {
    details: { dataPort: port, socketIOSecret: secret },
    connect,
    http,
    async interrupt() {
      const closed = new Promise<void>(resolve => http.close(() => resolve()))
      tcp.forEach(socket => socket.destroy())
      await closed
    },
    async repair() {
      if (!http.listening) await new Promise<void>(resolve => http.listen(port, '127.0.0.1', resolve))
    },
    async close() {
      await new Promise<void>(resolve => server.close(() => resolve()))
    },
  }
}

describe('QR return with a real local transport failure', () => {
  const { code } = getValidInvitationUrlTestData(validInvitationDatav4[0])
  let backends: Awaited<ReturnType<typeof createBackend>>[]
  let sockets: ReturnType<typeof io>[]
  let stateManagerTask: jest.SpyInstance

  beforeEach(() => {
    backends = []
    sockets = []
    ;(io as jest.Mock).mockImplementation((url, options) => {
      const socket = realIo(url, {
        ...options,
        transports: ['polling'],
        upgrade: false,
        reconnectionDelay: 20,
        reconnectionDelayMax: 20,
      })
      sockets.push(socket)
      return socket
    })
    stateManagerTask = jest.spyOn(stateManager, 'useIO').mockImplementation(function* () {
      // Run the real mobile transport/deep-link sagas; the community backend is
      // deliberately outside this test (JOIN dispatch is the handoff boundary).
      yield new Promise(() => undefined)
    })
  })

  afterEach(async () => {
    sockets.forEach(socket => socket.close())
    for (const backend of backends) await backend.close()
    stateManagerTask.mockRestore()
    ;(NativeModules.CommunicationModule.handleIncomingEvents as jest.Mock).mockReset()
    ;(io as jest.Mock).mockReset()
  })

  const run = () => {
    const channel = stdChannel()
    let state = allReducers(undefined, { type: 'test/init' })
    const actions: any[] = []
    const dispatch = (action: any) => {
      actions.push(action)
      state = allReducers(state, action)
      channel.put(action)
    }
    const task = runSaga({ channel, dispatch, getState: () => state }, initMasterSaga)
    return {
      task,
      dispatch,
      state: () => state,
      joins: () => actions.filter(a => a.type === communities.actions.joinCommunity.type),
    }
  }

  it('uses refreshed port and credentials instead of retrying a stale backend, and joins once', async () => {
    const oldBackend = await createBackend('old-secret')
    const currentBackend = await createBackend('current-secret')
    backends.push(oldBackend, currentBackend)
    const harness = run()
    try {
      harness.dispatch(initActions.startWebsocketConnection(oldBackend.details))
      await waitUntil(() => harness.state().Init.isWebsocketConnected)
      await oldBackend.interrupt()
      await waitUntil(() => !harness.state().Init.isWebsocketConnected)
      expect(sockets[0].active).toBe(true)
      const oldConnect = jest.spyOn(sockets[0], 'connect')
      ;(NativeModules.CommunicationModule.handleIncomingEvents as jest.Mock).mockImplementation(event => {
        if (event === RECOVER_WEBSOCKET_CHANNEL) {
          harness.dispatch(initActions.startWebsocketConnection(currentBackend.details))
        }
      })

      harness.dispatch(initActions.deepLink(code()))
      await waitUntil(() => harness.joins().length === 1)
      expect(harness.joins()).toEqual([communities.actions.joinCommunity({ inviteData: validInvitationDatav4[0] })])
      expect(harness.state().Init.lastKnownSocketIOData).toEqual(currentBackend.details)
      expect(oldConnect).not.toHaveBeenCalled()
      expect(sockets).toHaveLength(2)

      harness.dispatch(initActions.resumeWebsocketConnection())
      harness.dispatch(initActions.startWebsocketConnection(currentBackend.details))
      harness.dispatch(initActions.resumeWebsocketConnection())
      await tick()
      expect(currentBackend.connect).toHaveBeenCalledTimes(1)
      expect(harness.joins()).toHaveLength(1)
      expect(sockets).toHaveLength(2)
    } finally {
      harness.task.cancel()
      await harness.task.toPromise()
    }
  })

  it('recovers the same port through the native bridge while automatic polling retries fail', async () => {
    const backend = await createBackend('current-secret')
    backends.push(backend)
    const harness = run()
    let repair: Promise<void> | undefined
    try {
      harness.dispatch(initActions.startWebsocketConnection(backend.details))
      await waitUntil(() => harness.state().Init.isWebsocketConnected)
      await backend.interrupt()
      await waitUntil(() => !harness.state().Init.isWebsocketConnected)
      ;(NativeModules.CommunicationModule.handleIncomingEvents as jest.Mock).mockImplementation(event => {
        if (event === RECOVER_WEBSOCKET_CHANNEL) {
          repair = backend.repair()
          harness.dispatch(initActions.startWebsocketConnection(backend.details))
        }
      })
      harness.dispatch(initActions.deepLink(code()))
      harness.dispatch(initActions.resumeWebsocketConnection())
      await waitUntil(() => harness.joins().length === 1)
      await repair
      expect(NativeModules.CommunicationModule.handleIncomingEvents).toHaveBeenCalledTimes(1)
      expect(backend.connect).toHaveBeenCalledTimes(2)
      expect(sockets).toHaveLength(1)
    } finally {
      harness.task.cancel()
      await harness.task.toPromise()
    }
  })
})
