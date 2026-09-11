import React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import createSagaMiddleware, { Task } from 'redux-saga'
import { act, fireEvent, render, cleanup } from '@testing-library/react-native'
import { io } from 'socket.io-client'
import { communities, identity, CommunitiesTransform, StoreKeys } from '@quiet/state-manager'
import { InvitationDataVersion, InvitationDataV5, SocketActions } from '@quiet/types'
import { initMasterSaga } from '../../store/init/init.master.saga'
import { initActions } from '../../store/init/init.slice'
import { rootReducer } from '../../store/root.reducer'
import { JoinRecovery } from './JoinRecovery.component'
import { UsernameRegistrationScreen } from '../../screens/UsernameRegistration/UsernameRegistration.screen'
import { TermsOfServiceScreen } from '../../screens/TermsOfService/TermsOfService.screen'

// Keep the real mobile connection lifecycle and the whole state-manager task
// tree. Only the local transport/backend response is controlled by this fixture.
class JoinSocket {
  id = 'local-socket'
  connected = false
  active = false
  handlers = new Map<string, Set<(...args: any[]) => void>>()
  emit = jest.fn(() => this)
  emitWithAck = jest.fn(async (event: string, payload: any) => {
    if (event !== SocketActions.JOIN_COMMUNITY) return undefined
    return {
      id: payload.id,
      community: { id: payload.id, teamId: 'test-team', name: 'Test community', peerList: [] },
      identity: { communityId: payload.id, userId: 'local-user', joinTimestamp: null },
      profile: { userId: 'local-user', nickname: payload.username },
    }
  })
  on(event: string, handler: (...args: any[]) => void) {
    const listeners = this.handlers.get(event) ?? new Set()
    listeners.add(handler)
    this.handlers.set(event, listeners)
    return this
  }
  off(event: string) {
    this.handlers.delete(event)
    return this
  }
  trigger(event: string, ...args: any[]) {
    for (const listener of [...(this.handlers.get(event) ?? [])]) listener(...args)
  }
  connect = jest.fn(() => {
    this.connected = true
    this.active = true
    this.trigger('connect')
    return this
  })
  disconnect = jest.fn(() => {
    this.connected = false
    this.active = false
    this.trigger('disconnect', 'io client disconnect')
    return this
  })
  loseTransport() {
    this.connected = false
    this.active = true
    this.trigger('disconnect', 'transport error')
  }
}

const inviteData: InvitationDataV5 = {
  version: InvitationDataVersion.v5,
  pairs: [],
  psk: 'test-invitation-secret',
  authData: { communityName: 'Test community', teamId: 'test-team', seed: 'test-seed', salt: 'test-salt' },
  qssEnabled: true,
  qssEndpoint: 'wss://community.example',
}

const backend = { dataPort: 11000, socketIOSecret: 'test-local-secret' }

describe('joining across a real mobile state-manager disconnect', () => {
  let socket: JoinSocket
  let store: ReturnType<typeof createTestStore>
  let root: Task

  const createTestStore = () => {
    const middleware = createSagaMiddleware()
    const store = createStore(rootReducer, applyMiddleware(middleware))
    return { ...store, runSaga: middleware.run }
  }
  const pending = () => communities.selectors.pendingJoin(store.getState())
  const joinCalls = () => socket.emitWithAck.mock.calls.filter(([event]) => event === SocketActions.JOIN_COMMUNITY)
  const begin = () => store.dispatch(communities.actions.joinCommunity({ inviteData }))
  const username = () =>
    store.dispatch(identity.actions.registerUsername({ nickname: 'alice', isUsernameTaken: false }))
  const agree = () => store.dispatch(communities.actions.setTermsOfServiceAccepted({ accepted: true }))
  const flush = async () => {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    socket = new JoinSocket()
    jest.mocked(io).mockReturnValue(socket as any)
    store = createTestStore()
    root = store.runSaga(initMasterSaga)
    store.dispatch(initActions.startWebsocketConnection(backend))
  })

  afterEach(async () => {
    cleanup()
    root.cancel()
    await root.toPromise()
  })

  it.each(['username', 'terms'] as const)(
    'resumes the same draft after disconnect during %s, including input submitted while no saga is listening',
    async stage => {
      begin()
      const communityId = pending()?.communityId
      if (stage === 'terms') username()
      socket.loseTransport()
      if (stage === 'username') username()
      agree()
      expect(joinCalls()).toHaveLength(0)
      expect(pending()).toMatchObject({ communityId, username: 'alice', tosAccepted: true, status: 'draft' })

      socket.connect()
      await flush()
      expect(joinCalls()).toHaveLength(1)
      expect(joinCalls()[0][1]).toMatchObject({ id: communityId, username: 'alice', tosAccepted: true, inviteData })
      expect(communities.selectors.currentCommunity(store.getState())?.id).toBe(communityId)
      expect(pending()).toBeNull()

      store.dispatch(initActions.resumeWebsocketConnection())
      store.dispatch(initActions.resumeWebsocketConnection())
      store.dispatch(initActions.startWebsocketConnection(backend))
      socket.loseTransport()
      socket.connect()
      await flush()
      expect(joinCalls()).toHaveLength(1)
    }
  )

  it('keeps a permanent disconnect actionable and cancels an unsent draft without a later join', async () => {
    begin()
    username()
    socket.loseTransport()
    socket.connect.mockImplementation(() => socket)
    const screen = render(
      <Provider store={store}>
        <JoinRecovery>
          <Text>Joining now!</Text>
        </JoinRecovery>
      </Provider>
    )
    expect(screen.getByText('Joining paused')).toBeTruthy()
    expect(screen.queryByText('Joining now!')).toBeNull()
    fireEvent.press(screen.getByText('Try reconnecting'))
    expect(joinCalls()).toHaveLength(0)
    expect(pending()?.username).toBe('alice')
    fireEvent.press(screen.getByText('Cancel joining'))
    expect(pending()).toBeNull()
    await act(async () => {
      socket.connected = true
      socket.trigger('connect')
    })
    await flush()
    expect(joinCalls()).toHaveLength(0)
  })

  it('never retries a request which may have committed before its acknowledgement was lost', async () => {
    socket.emitWithAck.mockImplementation(() => new Promise(() => undefined))
    begin()
    username()
    agree()
    expect(joinCalls()).toHaveLength(1)
    socket.loseTransport()
    expect(pending()?.status).toBe('interrupted')

    socket.connect()
    store.dispatch(initActions.resumeWebsocketConnection())
    begin()
    await flush()
    expect(joinCalls()).toHaveLength(1)
    const screen = render(
      <Provider store={store}>
        <JoinRecovery>
          <Text>Joining now!</Text>
        </JoinRecovery>
      </Provider>
    )
    expect(screen.getByText('Joining was interrupted')).toBeTruthy()
    expect(screen.queryByText('Joining now!')).toBeNull()
    expect(screen.queryByText('Cancel joining')).toBeNull()
  })

  it('contains a rejected backend acknowledgement instead of killing the connection owner', async () => {
    socket.emitWithAck.mockRejectedValue(new Error('transport closed before acknowledgement'))
    begin()
    username()
    agree()
    await flush()
    expect(root.isRunning()).toBe(true)
    expect(pending()?.status).toBe('interrupted')
    socket.loseTransport()
    socket.connect()
    await flush()
    expect(joinCalls()).toHaveLength(1)
  })

  it('replaces an unsent invitation without allowing the canceled worker to affect its replacement', async () => {
    begin()
    const previousId = pending()?.communityId
    const replacement = {
      ...inviteData,
      authData: { ...inviteData.authData, communityName: 'Another community', teamId: 'another-team' },
    }
    store.dispatch(communities.actions.joinCommunity({ inviteData: replacement }))
    const replacementId = pending()?.communityId
    expect(replacementId).not.toBe(previousId)
    username()
    agree()
    await flush()
    expect(joinCalls()).toHaveLength(1)
    expect(joinCalls()[0][1]).toMatchObject({ id: replacementId, inviteData: replacement })
  })

  it('does not revive a declined invitation when the decline happened while disconnected', async () => {
    begin()
    username()
    socket.loseTransport()
    store.dispatch(communities.actions.setTermsOfServiceAccepted({ accepted: false }))
    socket.connect()
    await flush()
    expect(joinCalls()).toHaveLength(0)
    expect(pending()).toBeNull()
  })

  it('continues a Tor-only draft after reconnect without waiting for server terms', async () => {
    store.dispatch(
      communities.actions.joinCommunity({
        inviteData: { ...inviteData, version: InvitationDataVersion.v4 },
      })
    )
    socket.loseTransport()
    username()
    socket.connect()
    await flush()
    expect(joinCalls()).toHaveLength(1)
    expect(joinCalls()[0][1]).toMatchObject({ username: 'alice', tosAccepted: false })
  })

  it('preserves failed-join handling for an explicit negative backend acknowledgement', async () => {
    socket.emitWithAck.mockResolvedValueOnce(undefined)
    begin()
    username()
    agree()
    await flush()
    expect(pending()).toBeNull()
    expect(joinCalls()).toHaveLength(1)
    socket.loseTransport()
    socket.connect()
    await flush()
    expect(joinCalls()).toHaveLength(1)
  })

  it('keeps actual username and terms screens out of orphaned progress while disconnected', async () => {
    begin()
    const screen = render(
      <Provider store={store}>
        <UsernameRegistrationScreen route={{} as any} />
      </Provider>
    )
    fireEvent.changeText(screen.getByPlaceholderText('Enter a username'), 'alice')
    fireEvent.press(screen.getByText('Continue'))
    expect(pending()?.username).toBe('alice')
    await act(async () => socket.loseTransport())
    screen.rerender(
      <Provider store={store}>
        <TermsOfServiceScreen />
      </Provider>
    )
    expect(screen.getByText('Joining paused')).toBeTruthy()
    expect(screen.queryByText('Agree & Continue')).toBeNull()
    await act(async () => {
      socket.connect()
    })
    fireEvent.press(screen.getByText('Agree & Continue'))
    await flush()
    expect(joinCalls()).toHaveLength(1)
  })

  it('does not persist the invitation-bearing draft or replay it on a later app launch', () => {
    begin()
    username()
    const state = store.getState()[StoreKeys.Communities]
    const persisted = CommunitiesTransform.in(state, StoreKeys.Communities, store.getState())
    expect(persisted).not.toHaveProperty('pendingJoin')
    expect(persisted).not.toHaveProperty('invitationCodes')
    expect(JSON.stringify(persisted)).not.toContain(inviteData.authData.seed)
  })
})
