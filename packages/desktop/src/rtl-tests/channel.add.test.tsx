import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/dom'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'
import { createLogger } from './logger'

import CreateChannel from '../renderer/components/Channel/CreateChannel/CreateChannel'
import Channel from '../renderer/components/Channel/Channel'
import Sidebar from '../renderer/components/Sidebar/Sidebar'

import { getReduxStoreFactory, getSocketFactory, publicChannels } from '@quiet/state-manager'
import {
  ChannelType,
  Community,
  CreateChannelPayload,
  Identity,
  SendMessagePayload,
  SocketActions,
  UserProfile,
} from '@quiet/types'

import { ModalsInitialState } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { FieldErrors } from '../renderer/forms/fieldsErrors'

import { FactoryGirl } from 'factory-girl'
import { act, cleanup } from '@testing-library/react'
import { generateTestChannelId } from '@quiet/common'

const logger = createLogger('channel:add')

jest.setTimeout(20_000)

describe('Add new channel', () => {
  let socket: MockedSocket
  let socketFactory: FactoryGirl
  let channelIdCounter = 0
  const createBackendChannelId = () => `created-channel-id-${++channelIdCounter}`

  beforeEach(async () => {
    channelIdCounter = 0
    socketFactory = await getSocketFactory()
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

  it('shows channel creation when only private creation is permitted', async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community')
    await factory.create('Identity', { nickname: 'alice' })
    await factory.create('ChannelPermissions', {
      genericPermissions: {
        public: { create: false, delete: false },
        private: { create: true },
      },
    })

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
      </>,
      store
    )

    // The sidebar's "+" is SidebarHeader's action, keyed by actionTitle ('createChannel'). It
    // replaced a standalone AddChannelAction menu whose button was 'addChannelButton'.
    // findBy, not getBy: permissions are fail-closed and arrive on a socket event, so in the real
    // app the "+" appears a beat after first paint.
    expect(await screen.findByTestId('sidebar-button-createChannel')).toBeVisible()
  })

  it('hides channel creation when the user may create neither kind', async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community')
    await factory.create('Identity', { nickname: 'alice' })
    await factory.create('ChannelPermissions', {
      genericPermissions: {
        public: { create: false, delete: false },
        private: { create: false },
      },
    })

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
      </>,
      store
    )

    // Wait for something that proves the sidebar rendered before asserting on an absence —
    // otherwise this passes on an empty screen and would never catch the button coming back.
    await screen.findByTestId('channelsList')
    expect(screen.queryByTestId('sidebar-button-createChannel')).toBeNull()
  })

  it('Opens modal on button click', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    await factory.create('Community')
    await factory.create('Identity', {
      nickname: 'alice',
    })
    await factory.create('ChannelPermissions')

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
      </>,
      store
    )

    const addChannel = await screen.findByTestId('sidebar-button-createChannel')
    await userEvent.click(addChannel)

    const title = await screen.findByTestId('createChannelPanelTitle')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    await userEvent.click(privateToggle)
    expect(privateToggle.className.includes('checked')).toBeTruthy()
  })

  it('Adds new public channel and opens it. Sends initial message', async () => {
    const { store } = await prepareStore(
      {
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.createChannel]: { open: true },
        },
      },
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    await factory.create('ChannelPermissions')
    const channelName = { input: 'my-Super Channel ', output: 'my-super-channel-' }

    const mockImpl = async (...input: [string, ...any]) => {
      const action = input[0]
      if (action === SocketActions.CREATE_CHANNEL) {
        const payload = input[1] as CreateChannelPayload
        const channelId = createBackendChannelId()
        factory.create('PublicChannel', {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: userProfile.nickname,
            timestamp: 0,
            public: payload.public,
            type: payload.type,
          },
          displayedName: payload.name,
        })
        return socketFactory.build(`${SocketActions.CREATE_CHANNEL}_response`, {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: userProfile.nickname,
            timestamp: 0,
            public: payload.public,
          },
        })
      }
      if (action === SocketActions.SEND_MESSAGE) {
        const data = input[1] as SendMessagePayload
        const { message } = data
        factory.create('TestMessage', {
          message: {
            ...message,
          },
        })
      }
    }

    jest.spyOn(socket, 'emit').mockImplementation(mockImpl)
    // @ts-ignore
    socket.emitWithAck = mockImpl

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )
    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName.input)

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    await user.click(screen.getByTestId('channelNameSubmit'))
    await waitFor(() => expect(screen.getByTestId('channelTitle')).toHaveTextContent(channelName.output))

    const createChannelModal = screen.queryByTestId('createChannelModal')
    expect(createChannelModal).toBeNull()

    // Check if newly created channel is present and selected
    expect(screen.getByTestId('channelTitle')).toHaveTextContent(`${channelName.output}`)
    // Check if sidebar item displays as selected
    const link = screen.getByTestId(`${channelName.output}-link`)
    expect(link).toHaveClass('ChannelsListItemselected')
    const linkIcon = screen.getByTestId(`${channelName.output}-channel-link-icon-public`)
    expect(linkIcon).toBeVisible()
  })

  it('Adds new private channel and opens it. Sends initial message', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.createChannel]: { open: true },
        },
      },
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    await factory.create('ChannelPermissions')
    const channelName = { input: 'my-Super Channel ', output: 'my-super-channel-' }

    const mockImpl = async (...input: [string, ...any]) => {
      const action = input[0]
      if (action === SocketActions.CREATE_CHANNEL) {
        const payload = input[1] as CreateChannelPayload
        const channelId = createBackendChannelId()
        factory.create('PublicChannel', {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: userProfile.nickname,
            timestamp: 0,
            public: payload.public ?? true,
            type: ChannelType.CHANNEL,
          },
          displayedName: payload.name,
        })
        return socketFactory.build(`${SocketActions.CREATE_CHANNEL}_response`, {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: userProfile.nickname,
            timestamp: 0,
            public: payload.public ?? true,
            type: ChannelType.CHANNEL,
          },
          displayedName: payload.name,
        })
      }
      if (action === SocketActions.SEND_MESSAGE) {
        const data = input[1] as SendMessagePayload
        const { message } = data
        factory.create('TestMessage', {
          message: {
            ...message,
          },
        })
      }
    }

    jest.spyOn(socket, 'emit').mockImplementation(mockImpl)
    // @ts-ignore
    socket.emitWithAck = mockImpl

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )
    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName.input)

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    // The test id sits on MUI's switchBase, which wraps the checkbox that holds the state — so
    // press the switch as a user does, and assert the checkbox rather than a class on the span.
    // The press reaches the input because the row is the toggle's <label>; when that association
    // was missing the switch was unreachable from anywhere but the input itself.
    const privateInput = within(privateToggle).getByRole('checkbox')
    expect(privateInput).not.toBeChecked()

    await userEvent.click(privateToggle)
    expect(privateInput).toBeChecked()

    // FIXME: await user.click(screen.getByTestId('channelNameSubmit') causes this and few other tests to fail (hangs on taking createChannel action)
    await act(
      async () =>
        await waitFor(() => {
          user.click(screen.getByTestId('channelNameSubmit')).catch(e => {
            logger.error(e)
          })
        })
    )

    function* testCreateChannelSaga(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      const addChannelAction = yield* take(publicChannels.actions.addChannel)
    }

    await act(async () => {
      await runSaga(testCreateChannelSaga).toPromise()
    })

    const createChannelModal = screen.queryByTestId('createChannelModal')
    expect(createChannelModal).toBeNull()

    // Check if newly created channel is present and selected
    expect(screen.getByTestId('channelTitle')).toHaveTextContent(channelName.output)
    expect(screen.getByTestId('channelTitle-icon-private')).toBeVisible()
    // Check if sidebar item displays as selected
    const link = screen.getByTestId(`${channelName.output}-link`)
    expect(link).toHaveClass('ChannelsListItemselected')
    // Private channel: the sidebar shows the padlock, as the header two lines up already asserts.
    const linkIcon = screen.getByTestId(`${channelName.output}-channel-link-icon-private`)
    expect(linkIcon).toBeVisible()
  })

  it('Adds new private channel and opens it. Sends initial message', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.createChannel]: { open: true },
        },
      },
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    // Channel creation is permission-gated: without this the panel renders nothing at all. Every
    // other test in this file seeds it; this one did not, which is why it found no name field.
    await factory.create('ChannelPermissions')
    const channelName = { input: 'my-Super Channel ', output: 'my-super-channel-' }

    const mockImpl = async (...input: [string, ...any]) => {
      const action = input[0]
      if (action === SocketActions.CREATE_CHANNEL) {
        const payload = input[1] as CreateChannelPayload
        const channelId = generateTestChannelId(payload.name)
        factory.create('PublicChannel', {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: userProfile.nickname,
            timestamp: 0,
            public: payload.public ?? true,
            type: payload.type,
          },
          displayedName: payload.name,
        })
        return socketFactory.build(`${SocketActions.CREATE_CHANNEL}_response`, {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: userProfile.nickname,
            timestamp: 0,
            public: payload.public ?? true,
          },
          displayedName: payload.name,
        })
      }
      if (action === SocketActions.SEND_MESSAGE) {
        const data = input[1] as SendMessagePayload
        const { message } = data
        factory.create('TestMessage', {
          message: {
            ...message,
          },
        })
      }
    }

    jest.spyOn(socket, 'emit').mockImplementation(mockImpl)
    // @ts-ignore
    socket.emitWithAck = mockImpl

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )
    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName.input)

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    await userEvent.click(privateToggle)
    expect(privateToggle.className.includes('checked')).toBeTruthy()

    await user.click(screen.getByTestId('channelNameSubmit'))
    await waitFor(() => expect(screen.getByTestId('channelTitle')).toHaveTextContent(channelName.output))

    const createChannelModal = screen.queryByTestId('createChannelModal')
    expect(createChannelModal).toBeNull()

    // Check if newly created channel is present and selected
    expect(screen.getByTestId('channelTitle')).toHaveTextContent(channelName.output)
    expect(screen.getByTestId('channelTitle-icon-private')).toBeVisible()
    // Check if sidebar item displays as selected
    const link = screen.getByTestId(`${channelName.output}-link`)
    expect(link).toHaveClass('ChannelsListItemselected')
  })

  it('Input after reopen should be clear', async () => {
    const channelName = 'san-fierro'
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    await factory.create('ChannelPermissions')

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )

    const titleElement = await screen.findByTestId('channelTitle')
    const isGeneralAtStart = titleElement.textContent === 'general'
    expect(isGeneralAtStart).toBeTruthy()
    expect(titleElement).toBeVisible()

    const addChannel = await screen.findByTestId('sidebar-button-createChannel')
    await userEvent.click(addChannel)

    const title = await screen.findByTestId('createChannelPanelTitle')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName)
    expect(input).toHaveValue(channelName)

    // Create-channel is a right-hand Drawer now, not a centred Modal: close is the panel header's
    // glyph rather than a button inside ModalActions.
    const closeChannel = screen.getByTestId('createChannelPanelClose')
    await userEvent.click(closeChannel)

    const newTitleElement = await screen.findByTestId('channelTitle')
    const isGeneralAgain = newTitleElement.textContent === 'general'
    expect(isGeneralAgain).toBeTruthy()
    expect(newTitleElement).toBeVisible()

    await userEvent.click(addChannel)
    const input2 = screen.getByPlaceholderText('Enter a channel name')
    expect(input2).toHaveValue('')
  })

  it('Bug reproduction - open and close modal and check there are any errors', async () => {
    const channelName = ''
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    await factory.create('ChannelPermissions')

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )

    const titleElement = await screen.findByTestId('channelTitle')
    const isGeneralAtStart = titleElement.textContent === 'general'
    expect(isGeneralAtStart).toBeTruthy()
    expect(titleElement).toBeVisible()

    const addChannel = await screen.findByTestId('sidebar-button-createChannel')
    await userEvent.click(addChannel)

    const title = await screen.findByTestId('createChannelPanelTitle')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    expect(input).toHaveValue(channelName)

    const button = screen.getByTestId('channelNameSubmit')
    await userEvent.click(button)

    const error = await screen.findByText(FieldErrors.Required)
    expect(error).toBeVisible()

    // Create-channel is a right-hand Drawer now, not a centred Modal: close is the panel header's
    // glyph rather than a button inside ModalActions.
    const closeChannel = screen.getByTestId('createChannelPanelClose')
    await userEvent.click(closeChannel)

    const newTitleElement = await screen.findByTestId('channelTitle')
    const isGeneralAgain = newTitleElement.textContent === 'general'
    expect(isGeneralAgain).toBeTruthy()
    expect(newTitleElement).toBeVisible()

    await userEvent.click(addChannel)
    const title2 = await screen.findByTestId('createChannelPanelTitle')
    expect(title2).toBeVisible()

    const isErrorStillExist = screen.queryByText(FieldErrors.Required)
    expect(isErrorStillExist).toBeNull()
  })

  it('Bug reproduction - create channel and open modal again without requierd field error', async () => {
    const channelName = 'las-venturas'

    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    await factory.create('ChannelPermissions')

    const mockImpl = async (...input: [string, ...any]) => {
      const action = input[0]
      if (action === SocketActions.CREATE_CHANNEL) {
        const payload = input[1] as CreateChannelPayload
        const channelId = createBackendChannelId()
        factory.create('PublicChannel', {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: 'alice',
            timestamp: 0,
            public: true,
            type: payload.type,
            teamId: payload.teamId,
          },
          // The factory otherwise assigns a `public-channel-N` sequence, and the header reads
          // displayedName — so the title would never become the name that was typed.
          displayedName: payload.name,
        })
        return socketFactory.build(`${SocketActions.CREATE_CHANNEL}_response`, {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: 'alice',
            timestamp: 0,
            public: payload.public,
            teamId: payload.teamId,
          },
        })
      }
      if (action === SocketActions.SEND_MESSAGE) {
        const data = input[1] as SendMessagePayload
        const { message } = data
        factory.create('TestMessage', {
          message: {
            ...message,
          },
        })
      }
    }

    jest.spyOn(socket, 'emit').mockImplementation(mockImpl)
    // @ts-ignore
    socket.emitWithAck = mockImpl

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )

    const titleElement = await screen.findByTestId('channelTitle')
    const isGeneralAtStart = titleElement.textContent === 'general'
    expect(isGeneralAtStart).toBeTruthy()
    expect(titleElement).toBeVisible()

    const addChannel = await screen.findByTestId('sidebar-button-createChannel')
    await userEvent.click(addChannel)

    const title = await screen.findByTestId('createChannelPanelTitle')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName)
    expect(input).toHaveValue(channelName)

    await user.click(screen.getByTestId('channelNameSubmit'))
    await waitFor(() => expect(screen.getByTestId('channelTitle')).toHaveTextContent(channelName))

    const newTitleElement = await screen.findByTestId('channelTitle')
    const isNewChannel = newTitleElement.textContent === channelName
    expect(isNewChannel).toBeTruthy()
    expect(newTitleElement).toBeVisible()

    await userEvent.click(addChannel)
    const title2 = await screen.findByTestId('createChannelPanelTitle')
    expect(title2).toBeVisible()

    const isErrorExist = screen.queryByText(FieldErrors.Required)
    expect(isErrorExist).toBeNull()
  })

  it('Adds few new channels and check order', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.createChannel]: { open: true },
        },
      },
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    const community: Community = await factory.create('Community')
    const userProfile: UserProfile = await factory.create('UserProfile', {
      nickname: 'alice',
    })
    const alice: Identity = await factory.create('Identity', {
      userId: userProfile.userId,
      communityId: community.id,
    })
    await factory.create('ChannelPermissions')

    const channels = ['zzz', 'abc', '12a']
    const mockImpl = async (...input: [string, ...any]) => {
      const action = input[0]
      if (action === SocketActions.CREATE_CHANNEL) {
        const payload = input[1] as CreateChannelPayload
        const channelId = createBackendChannelId()
        factory.create('PublicChannel', {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: 'alice',
            timestamp: 0,
            public: payload.public,
            type: payload.type,
            teamId: community.teamId,
          },
        })
        return socketFactory.build(`${SocketActions.CREATE_CHANNEL}_response`, {
          channel: {
            id: channelId,
            name: payload.name,
            description: payload.description ?? '',
            owner: 'alice',
            timestamp: 0,
            public: payload.public,
            teamId: community.teamId,
          },
        })
      }
      if (action === SocketActions.SEND_MESSAGE) {
        const data = input[1] as SendMessagePayload
        const { message } = data
        factory.create('TestMessage', {
          message: {
            ...message,
          },
        })
      }
    }
    jest.spyOn(socket, 'emit').mockImplementation(mockImpl)
    // @ts-ignore
    socket.emitWithAck = mockImpl

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )

    const titleElement = await screen.findByTestId('channelTitle')
    const isGeneralAtStart = titleElement.textContent === 'general'
    expect(isGeneralAtStart).toBeTruthy()
    expect(titleElement).toBeVisible()

    for await (const channel of channels) {
      const addChannel = await screen.findByTestId('sidebar-button-createChannel')
      await userEvent.click(addChannel)

      const title = await screen.findByTestId('createChannelPanelTitle')
      expect(title).toBeVisible()

      const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
      expect(privateToggle).toBeVisible()
      expect(privateToggle.className.includes('checked')).toBeFalsy()

      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Enter a channel name')

      await user.type(input, channel)
      // Unlike the single-channel tests above, this one's socket mock never makes the new channel
      // current, so there is no title to wait on; wait for the create to round-trip instead.
      await act(
        async () =>
          await waitFor(() => {
            user.click(screen.getByTestId('channelNameSubmit')).catch(e => {
              logger.error(e)
            })
          })
      )
      await act(async () => {
        await runSaga(testCreateChannelSaga).toPromise()
      })
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100))
    }

    function* testCreateChannelSaga(): Generator {
      yield* take(publicChannels.actions.createChannel)
      yield* take(publicChannels.actions.addChannel)
    }

    const createChannelModal = screen.queryByTestId('createChannelModal')
    expect(createChannelModal).toBeNull()
    const list = await screen.findByTestId('channelsList')
    const textContent = list.textContent
    expect(textContent).not.toBeNull()
    expect(textContent).toEqual(['general', '12a', 'abc', 'zzz'].join(''))
  })
})
