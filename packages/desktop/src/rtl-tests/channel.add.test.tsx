import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/dom'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'

import CreateChannel from '../renderer/components/Channel/CreateChannel/CreateChannel'
import Channel from '../renderer/components/Channel/Channel'
import Sidebar from '../renderer/components/Sidebar/Sidebar'

import { getReduxStoreFactory, getSocketFactory, publicChannels } from '@quiet/state-manager'
import { Community, CreateChannelPayload, Identity, SendMessagePayload, SocketActions, UserProfile } from '@quiet/types'

import { ModalsInitialState } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { FieldErrors } from '../renderer/forms/fieldsErrors'

import { createLogger } from './logger'
import { FactoryGirl } from 'factory-girl'
import { act, cleanup } from '@testing-library/react'

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

    const addChannel = screen.getByTestId('addChannelButton')
    await userEvent.click(addChannel)

    const title = await screen.findByText('Create a new channel')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    await userEvent.click(privateToggle)
    expect(privateToggle.className.includes('checked')).toBeTruthy()
  })

  it('Adds new public channel and opens it. Sends initial message', async () => {
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
            public: payload.public,
          },
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

    // FIXME: await user.click(screen.getByText('Create Channel') causes this and few other tests to fail (hangs on taking createChannel action)
    await act(
      async () =>
        await waitFor(() => {
          user.click(screen.getByText('Create Channel')).catch(e => {
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
          },
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

    // FIXME: await user.click(screen.getByText('Create Channel') causes this and few other tests to fail (hangs on taking createChannel action)
    await act(
      async () =>
        await waitFor(() => {
          user.click(screen.getByText('Create Channel')).catch(e => {
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

    const addChannel = screen.getByTestId('addChannelButton')
    await userEvent.click(addChannel)

    const title = await screen.findByText('Create a new channel')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName)
    expect(input).toHaveValue(channelName)

    const closeChannel = screen.getByTestId('ModalActions').querySelector('button')
    expect(closeChannel).not.toBeNull()
    // @ts-expect-error
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

    const addChannel = screen.getByTestId('addChannelButton')
    await userEvent.click(addChannel)

    const title = await screen.findByText('Create a new channel')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    expect(input).toHaveValue(channelName)

    const button = screen.getByText('Create Channel')
    await userEvent.click(button)

    const error = await screen.findByText(FieldErrors.Required)
    expect(error).toBeVisible()

    const closeChannel = screen.getByTestId('ModalActions').querySelector('button')
    expect(closeChannel).not.toBeNull()
    // @ts-expect-error
    await userEvent.click(closeChannel)

    const newTitleElement = await screen.findByTestId('channelTitle')
    const isGeneralAgain = newTitleElement.textContent === 'general'
    expect(isGeneralAgain).toBeTruthy()
    expect(newTitleElement).toBeVisible()

    await userEvent.click(addChannel)
    const title2 = await screen.findByText('Create a new channel')
    expect(title2).toBeVisible()

    const isErrorStillExist = screen.queryByText(FieldErrors.Required)
    expect(isErrorStillExist).toBeNull()
  })

  it('Bug reproduction - create channel and open modal again without requierd field error', async () => {
    const channelName = 'las-venturas'

    const { store, runSaga } = await prepareStore(
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
            teamId: payload.teamId,
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

    const addChannel = screen.getByTestId('addChannelButton')
    await userEvent.click(addChannel)

    const title = await screen.findByText('Create a new channel')
    expect(title).toBeVisible()

    const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
    expect(privateToggle).toBeVisible()
    expect(privateToggle.className.includes('checked')).toBeFalsy()

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName)
    expect(input).toHaveValue(channelName)

    await act(
      async () =>
        await waitFor(() => {
          user.click(screen.getByText('Create Channel')).catch(e => {
            logger.error(e)
          })
        })
    )

    await act(async () => {
      await runSaga(testCreateChannelSaga).toPromise()
    })

    function* testCreateChannelSaga(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      const addChannelAction = yield* take(publicChannels.actions.addChannel)
    }

    const newTitleElement = await screen.findByTestId('channelTitle')
    const isNewChannel = newTitleElement.textContent === channelName
    expect(isNewChannel).toBeTruthy()
    expect(newTitleElement).toBeVisible()

    await userEvent.click(addChannel)
    const title2 = await screen.findByText('Create a new channel')
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
      const addChannel = screen.getByTestId('addChannelButton')
      await userEvent.click(addChannel)

      const title = await screen.findByText('Create a new channel')
      expect(title).toBeVisible()

      const privateToggle = screen.getByTestId('createChannel-private-form-control-toggle')
      expect(privateToggle).toBeVisible()
      expect(privateToggle.className.includes('checked')).toBeFalsy()

      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Enter a channel name')

      await user.type(input, channel)
      await act(
        async () =>
          await waitFor(() => {
            user.click(screen.getByText('Create Channel')).catch(e => {
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
