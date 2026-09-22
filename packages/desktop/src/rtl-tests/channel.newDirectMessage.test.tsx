import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { ChannelType, PublicChannel, UserProfile } from '@quiet/types'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import Channel from '../renderer/components/Channel/Channel'
import { publicChannels, getReduxStoreFactory, messages } from '@quiet/state-manager'

import { FETCHING_CHANNEL_MESSAGES } from '../renderer/components/widgets/channels/ChannelMessages'
import { cleanup } from '@testing-library/react'
import { SEARCH_PLACEHOLDER_TEXT } from '../renderer/components/Channel/NewDirectMessage.component'
import { dmMemberHashFor, generateDmMemberHash, generateTestChannelId } from '@quiet/common'

jest.setTimeout(20_000)

describe('New Direct Message', () => {
  let socket: MockedSocket
  let notification: any

  beforeEach(() => {
    notification = jest.fn().mockImplementation(() => {
      return jest.fn()
    })
    window.Notification = notification
    jest.mock('electron', () => {
      return {
        ipcRenderer: { on: () => {}, send: jest.fn(), sendSync: jest.fn() },
        remote: {
          BrowserWindow: {
            getAllWindows: () => {
              return [
                {
                  show: jest.fn(),
                  isFocused: jest.fn(),
                },
              ]
            },
          },
        },
      }
    })

    jest.mock('../shared/sounds', () => ({
      ...jest.requireActual('../shared/sounds'),
      soundTypeToAudio: {
        pow: {
          play: jest.fn(),
        },
      },
    }))

    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })
  afterEach(() => {
    cleanup()
  })

  it("causes no error if there's no data yet", async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )
  })

  it(`doesn't display before opened`, async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const nickname = 'alice'
    const alice = await factory.create('Identity', { userId: 'alice123' })
    const alicesUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      nickname: nickname,
    })
    const alicesUser = await factory.create('User', { userId: alice.userId })
    const publicChannel = await factory.create<PublicChannel>('PublicChannel')
    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const channelName = screen.getByText('general')
    expect(channelName).toBeVisible()

    const messageInput = screen.getByPlaceholderText(`Message #general as @${nickname}`)
    expect(messageInput).toBeVisible()

    expect(() => screen.getByText('New message')).toThrow()
    expect(() => screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)).toThrow()
  })

  it('displays properly on open', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const nickname = 'alice'
    const alice = await factory.create('Identity', { userId: 'alice123' })
    const alicesUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      nickname: nickname,
    })
    const alicesUser = await factory.create('User', { userId: alice.userId })
    const publicChannel = await factory.create<PublicChannel>('PublicChannel')
    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      store.dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: true,
          prevChannelId: publicChannel.id,
        })
      )
    })

    const headerTitle = screen.getByText('New message')
    expect(headerTitle).toBeVisible()

    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)
    expect(searchInput).toBeVisible()

    const messageInput = screen.getByTestId('messageInput')
    expect(messageInput).toBeVisible()

    expect(() => screen.getByText(FETCHING_CHANNEL_MESSAGES)).toThrow()
  })

  it('switches to inputtable when user selected and no channel exists', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const nickname = 'alice'
    const alice = await factory.create('Identity', { userId: 'alice123' })
    const alicesUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      nickname: nickname,
    })
    const suesUserProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'sue',
    })
    const alicesUser = await factory.create('User', { userId: alice.userId })
    const publicChannel = await factory.create<PublicChannel>('PublicChannel')

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      store.dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: true,
          prevChannelId: publicChannel.id,
        })
      )
    })

    const headerTitle = screen.getByText('New message')
    expect(headerTitle).toBeVisible()

    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)
    expect(searchInput).toBeVisible()

    let messageInput = screen.getByTestId('messageInput')
    expect(messageInput).toBeVisible()

    expect(() => screen.getByText(FETCHING_CHANNEL_MESSAGES)).toThrow()

    await userEvent.type(searchInput, suesUserProfile.nickname)
    await userEvent.type(searchInput, '{enter}')

    // Typing a name and pressing Enter is exactly what the e2e suites' `changeDmUsers` does, and
    // the pill's test id is how they decide the recipient was accepted. Asserting it by id rather
    // than by loose text is what would have caught the drift when this branch replaced MUI's Chip
    // with RecipientPill: the e2e went on looking for `MuiChip-label`, reported the recipient as
    // failed, and the DM was created anyway - so three later stages cascaded off nothing.
    const recipientPill = await screen.findByTestId(`new-message-recipient-pill-${suesUserProfile.nickname}`)
    expect(recipientPill).toBeVisible()
    expect(screen.getByTestId(`new-message-recipient-pill-remove-${suesUserProfile.nickname}`)).toBeVisible()

    messageInput = screen.getByPlaceholderText(`Message ${suesUserProfile.nickname} as @${alicesUserProfile.nickname}`)
    expect(messageInput).toBeVisible()
  })

  it('shows messages when dm channel already exists', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const nickname = 'alice'
    const alice = await factory.create('Identity', { userId: 'alice123' })
    const alicesUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      nickname: nickname,
    })
    const suesUserProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'sue',
    })
    const alicesUser = await factory.create('User', { userId: alice.userId })
    const publicChannel = await factory.create<PublicChannel>('PublicChannel')

    const dmChannelMemberIds = [alicesUserProfile.userId, suesUserProfile.userId]
    const dmChannelMemberHash = generateDmMemberHash(dmChannelMemberIds)
    const dmChannel = await factory.create<PublicChannel>('PublicChannel', {
      channel: {
        type: ChannelType.DM,
        memberIds: dmChannelMemberIds,
        id: generateTestChannelId(dmChannelMemberHash),
        name: dmChannelMemberHash,
        memberIdHash: dmChannelMemberHash,
      },
      displayedName: 'sue',
    })
    window.HTMLElement.prototype.scrollTo = jest.fn()

    const messageText = 'hello!'

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      store.dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: true,
          prevChannelId: publicChannel.id,
        })
      )
    })

    const headerTitle = screen.getByText('New message')
    expect(headerTitle).toBeVisible()

    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)
    expect(searchInput).toBeVisible()

    let messageInput = screen.getByTestId('messageInput')
    expect(messageInput).toBeVisible()

    expect(() => screen.getByText(FETCHING_CHANNEL_MESSAGES)).toThrow()

    await act(async () => {
      await userEvent.type(searchInput, suesUserProfile.nickname)
      await userEvent.type(searchInput, '{enter}')
    })

    const aliceTag = screen.getByText(suesUserProfile.nickname)
    expect(aliceTag).toBeVisible()

    messageInput = screen.getByPlaceholderText(`Message ${suesUserProfile.nickname} as @${alicesUserProfile.nickname}`)
    expect(messageInput).toBeVisible()

    await act(async () => {
      store.dispatch(
        messages.actions.sendMessage({
          message: messageText,
          channelId: publicChannels.selectors.currentChannelId(store.getState())!,
        })
      )
    })

    // Get sent message for further assertions
    const sentMessage = publicChannels.selectors.currentChannelMessages(store.getState())[0]

    // Confirm message has been stored immediately
    const displayableMessages = publicChannels.selectors.currentChannelMessagesMergedBySender(store.getState())
    expect(Object.values(displayableMessages).length).toBe(1)

    expect(await screen.findByText(messageText)).toBeVisible()
  })

  it('switches to dm channel when message sent', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const nickname = 'alice'
    const alice = await factory.create('Identity', { userId: 'alice123' })
    const alicesUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      nickname: nickname,
    })
    const suesUserProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'sue',
    })
    const alicesUser = await factory.create('User', { userId: alice.userId })
    const publicChannel = await factory.create<PublicChannel>('PublicChannel')
    const dmChannelMemberIds = [alicesUserProfile.userId, suesUserProfile.userId]
    const dmChannelMemberHash = generateDmMemberHash(dmChannelMemberIds)
    const dmChannel = await factory.create<PublicChannel>('PublicChannel', {
      channel: {
        type: ChannelType.DM,
        memberIds: dmChannelMemberIds,
        id: generateTestChannelId(dmChannelMemberHash),
        name: dmChannelMemberHash,
        memberIdHash: dmChannelMemberHash,
      },
      displayedName: 'sue',
    })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      store.dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: true,
          prevChannelId: publicChannel.id,
        })
      )
    })

    const headerTitle = screen.getByText('New message')
    expect(headerTitle).toBeVisible()

    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)
    expect(searchInput).toBeVisible()

    let messageInput = screen.getByTestId('messageInput')
    expect(messageInput).toBeVisible()

    expect(() => screen.getByText(FETCHING_CHANNEL_MESSAGES)).toThrow()

    await userEvent.type(searchInput, suesUserProfile.nickname)
    await userEvent.type(searchInput, '{enter}')

    const aliceTag = screen.getByText(suesUserProfile.nickname)
    expect(aliceTag).toBeVisible()

    messageInput = screen.getByPlaceholderText(`Message ${suesUserProfile.nickname} as @${alicesUserProfile.nickname}`)
    expect(messageInput).toBeVisible()

    const messageText = 'hello!'
    await act(async () => {
      await userEvent.type(messageInput, messageText)
      await userEvent.type(messageInput, '{enter}')
    })

    const channelName = screen.getByText(suesUserProfile.nickname)
    expect(channelName).toBeVisible()

    messageInput = screen.getByPlaceholderText(`Message ${suesUserProfile.nickname} as @${alicesUserProfile.nickname}`)
    expect(messageInput).toBeVisible()

    expect(() => screen.getByText('New message')).toThrow()
    expect(() => screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)).toThrow()

    expect(await screen.findByText(messageText)).toBeVisible()
  })

  // Both of these go through the one DM lookup shared with mobile (`findDmChannelWithMembers`), which
  // always adds me, de-duplicates and sorts before hashing. The composer used to build the list by hand
  // and compare only a stored `memberIdHash`.
  const openComposerWith = async (store: Awaited<ReturnType<typeof prepareStore>>['store'], nickname: string) => {
    const publicChannel = await (await getReduxStoreFactory(store)).create<PublicChannel>('PublicChannel')
    window.HTMLElement.prototype.scrollTo = jest.fn()
    renderComponent(<Channel />, store)
    await act(async () => {
      store.dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true, prevChannelId: publicChannel.id }))
    })
    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER_TEXT)
    await act(async () => {
      await userEvent.type(searchInput, nickname)
      await userEvent.type(searchInput, '{enter}')
    })
  }

  it('opens the existing DM with yourself when you choose yourself', async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    const alice = await factory.create('Identity', { userId: 'alice123' })
    await factory.create('UserProfile', { userId: alice.userId, nickname: 'alice' })
    await factory.create('UserProfile', { nickname: 'sue' })
    await factory.create('User', { userId: alice.userId })
    const selfHash = dmMemberHashFor([], alice.userId)
    await factory.create('PublicChannel', {
      channel: {
        type: ChannelType.DM,
        memberIds: [alice.userId],
        id: generateTestChannelId('self-dm'),
        name: selfHash,
        memberIdHash: selfHash,
      },
      displayedName: 'alice',
    })

    await openComposerWith(store, 'alice')

    expect(publicChannels.selectors.currentChannelId(store.getState())).toEqual(generateTestChannelId('self-dm'))
  })

  it('opens an existing DM that was replicated before its member hash was stored', async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    const alice = await factory.create('Identity', { userId: 'alice123' })
    await factory.create('UserProfile', { userId: alice.userId, nickname: 'alice' })
    const sue: UserProfile = await factory.create('UserProfile', { nickname: 'sue' })
    await factory.create('User', { userId: alice.userId })
    await factory.create('PublicChannel', {
      channel: {
        type: ChannelType.DM,
        memberIds: [sue.userId, alice.userId],
        id: generateTestChannelId('legacy-dm'),
        name: 'Direct message',
      },
      displayedName: 'sue',
    })

    await openComposerWith(store, 'sue')

    expect(publicChannels.selectors.currentChannelId(store.getState())).toEqual(generateTestChannelId('legacy-dm'))
  })
})
