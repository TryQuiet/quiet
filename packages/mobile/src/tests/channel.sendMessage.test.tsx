import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { EmitterSubscription, Keyboard, KeyboardEventName } from 'react-native'
import MockedSocket from 'socket.io-mock'
import { Task } from 'redux-saga'
import { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory, publicChannels } from '@quiet/state-manager'
import { MessageType } from '@quiet/types'
import { DateTime } from 'luxon'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { ChannelScreen } from '../screens/Channel/Channel.screen'
import { initSelectors } from '../store/init/init.selectors'
import { Store } from '../store/store.types'

// Chat.component defers the actual send by 50ms so iOS can commit a pending autocorrection
const AUTOCORRECT_COMMIT_DELAY = 50

// Mobile already trims the input inside Chat.component before it reaches this screen,
// so these tests pin the end-to-end invariant rather than reproduce #2778 - the drop
// itself now lives in the shared state-manager sendMessage saga, which both platforms
// go through.
describe('Sending a message from a channel', () => {
  let socket: MockedSocket
  let root: Task | null = null
  let keyboardListeners: Record<string, () => void> = {}

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    keyboardListeners = {}
    // The send button only renders once the keyboard is up, and the react-native jest
    // preset never delivers keyboard events, so capture the listeners and call them.
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event: KeyboardEventName, handler) => {
      keyboardListeners[event] = handler as () => void
      return { remove: jest.fn() } as unknown as EmitterSubscription
    })
  })

  afterEach(() => {
    // Always stop the state-manager sagas - a failed assertion would otherwise leave
    // them running and hang jest.
    root?.cancel()
    root = null
    jest.restoreAllMocks()
  })

  const renderChannel = async (): Promise<Store> => {
    const prepared = await prepareStore({}, socket)
    root = prepared.root
    const store = prepared.store

    const factory: FactoryGirl = await getReduxStoreFactory(store)

    const community = await factory.create('Community')
    const alice = await factory.create('Identity', { communityId: community.id })
    await factory.create('UserProfile', { userId: alice.userId, nickname: alice.nickname })

    // A freshly created channel is not literally empty - it holds the "created this
    // channel" info message. Mobile renders a loading state (and no input at all)
    // until a channel has at least one message, so seed that info message here.
    const channelId = publicChannels.selectors.currentChannelId(store.getState())
    await factory.create('TestMessage', {
      message: {
        id: 'channel-created',
        type: MessageType.Info,
        message: `@${alice.nickname} created #general`,
        createdAt: DateTime.utc().valueOf(),
        channelId,
        userId: alice.userId,
        verified: true,
      },
      verifyAutomatically: true,
    })

    renderComponent(<ChannelScreen />, store)

    // Sending is only enabled once the (mocked) websocket reports a connection
    await waitFor(() => expect(initSelectors.isWebsocketConnected(store.getState())).toBe(true), { timeout: 5000 })

    act(() => {
      keyboardListeners.keyboardDidShow?.()
    })

    return store
  }

  const send = async (text: string) => {
    fireEvent.changeText(screen.getByTestId('input'), text)
    fireEvent.press(screen.getByTestId('send_message_button'))
    // Let the deferred send fire and the state-manager saga run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, AUTOCORRECT_COMMIT_DELAY * 4))
    })
  }

  // https://github.com/TryQuiet/quiet/issues/2778
  test('a whitespace-only message is not sent from a fresh channel', async () => {
    const store = await renderChannel()

    const before = publicChannels.selectors.currentChannelMessages(store.getState())
    expect(before.map(message => message.type)).toEqual([MessageType.Info])

    await send(' ')

    // Nothing new arrived - the blank message was dropped
    expect(publicChannels.selectors.currentChannelMessages(store.getState())).toEqual(before)
  })

  test('a message with content is still sent', async () => {
    const store = await renderChannel()

    await send('hello')

    const sent = publicChannels.selectors
      .currentChannelMessages(store.getState())
      .filter(message => message.type === MessageType.Basic)
    expect(sent.length).toBe(1)
    expect(sent[0].message).toBe('hello')
  })
})
