import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore, testReducers } from '../renderer/testUtils/prepareStore'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { JoinCommunityDictionary } from '../renderer/components/CreateJoinCommunity/community.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import Channel from '../renderer/components/Channel/Channel'
import TermsOfService from '../renderer/components/TermsOfService/TermsOfService'
import LoadingPanel from '../renderer/components/LoadingPanel/LoadingPanel'
import { AnyAction } from 'redux'
import {
  InvitationData,
  ChannelsReplicatedPayload,
  ChannelSubscribedPayload,
  ResponseLaunchCommunityPayload,
  SocketActions,
  SocketEvents,
  socketEventData,
  InvitationDataVersion,
  InvitationAuthData,
  InitCommunityPayload,
  ErrorMessages,
  ResponseJoinCommunityPayload,
  CommunityOwnership,
} from '@quiet/types'
import { composeInvitationShareUrl, getValidInvitationUrlTestData, validInvitationDatav3 } from '@quiet/common'

import { createLogger } from './logger'
import { socketActions } from '../renderer/sagas/socket/socket.slice'

const logger = createLogger('community.join.test')

jest.setTimeout(20_000)

// Common mock emit implementation used by join flows
const makeMockEmitImpl = (socket: MockedSocket, opts?: { qss?: boolean }) => {
  const qss = opts?.qss ?? false
  return async (...input: [SocketActions, ...socketEventData<[any]>]) => {
    const action = input[0]
    logger.info('emitWithAck', action)
    switch (action) {
      case SocketActions.JOIN_COMMUNITY: {
        const payload = input[1] as InitCommunityPayload
        // Simulate server progress events
        socket.socketClient.emit<ChannelsReplicatedPayload>(SocketEvents.CHANNELS_STORED, {
          channels: [
            {
              name: 'general',
              description: 'string',
              owner: 'owner',
              timestamp: 0,
              id: 'general',
            },
          ],
        })
        socket.socketClient.emit<ChannelSubscribedPayload>(SocketEvents.CHANNEL_SUBSCRIBED, {
          channelId: 'general',
        })
        return {
          id: payload.id,
          community: {
            id: payload.id,
            name: 'community',
            ownership: CommunityOwnership.User,
            ...(qss ? { qssEnabled: true } : {}),
          },
          identity: {
            communityId: payload.id,
            userId: 'alice123',
            nickname: 'alice',
            networkInfo: {
              hiddenService: {
                onionAddress: 'onionAddress',
                privateKey: 'privateKey',
              },
              peerId: {
                id: 'id',
                privKey: 'privKey',
                noiseKey: 'noiseKey',
              },
            },
            joinTimestamp: 0,
          },
          profile: {
            userId: 'alice123',
            nickname: 'alice',
          },
        } as ResponseJoinCommunityPayload
      }
      case SocketActions.LAUNCH_COMMUNITY: {
        return {
          id: 'community-id',
          community: {
            id: 'community-id',
            name: 'community-name',
          },
          identity: {
            nickname: 'alice',
            userId: 'alice123',
            networkInfo: {
              hiddenService: {
                onionAddress: 'onionAddress',
                privateKey: 'privateKey',
              },
              peerId: {
                id: 'id',
                privKey: 'privKey',
                noiseKey: 'noiseKey',
              },
            },
          },
        } as ResponseLaunchCommunityPayload
      }
      default:
        throw new Error(`Unexpected action: ${action}`)
    }
  }
}

describe('User', () => {
  let socket: MockedSocket
  const validData: InvitationData = {
    version: InvitationDataVersion.v2,
    pairs: [
      {
        onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
        peerId: '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
      },
    ],
    psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
    authData: {
      communityName: 'testCommunityName',
      seed: '123456789abcdefg',
    } as InvitationAuthData,
  }
  const validCode = composeInvitationShareUrl(validData)
  // trigger
  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
    jest.mock('../renderer', () => ({
      ...jest.requireActual('../renderer'),
      clearCommunity: jest.fn(),
    }))
  })

  it('joins community and registers username', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <LoadingPanel />
        <JoinCommunity />
        <CreateUsername />
        <Channel />
      </>,
      store
    )

    const mockEmitImpl = makeMockEmitImpl(socket)

    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action: AnyAction = yield* take()
        actions.push(action.type)
      }
    })

    // Confirm proper modal title is displayed
    const dictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(dictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const joinCommunityButton = screen.getByText(dictionary.button)
    await userEvent.type(joinCommunityInput, validCode)
    expect(joinCommunityInput).toHaveValue(validCode)
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    expect(createUsernameButton).toBeVisible()
    expect(createUsernameInput).toBeVisible()
    await userEvent.type(createUsernameInput, 'alice')
    expect(createUsernameInput).toHaveValue('alice')
    await userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if join/username modals are gone
    expect(createUsernameButton).not.toBeVisible()
    expect(createUsernameInput).not.toBeVisible()
    expect(joinCommunityTitle).not.toBeVisible()
    expect(createUsernameTitle).not.toBeVisible()

    // Check if channel page is visible
    const channelPage = await screen.findByText('#general')
    expect(channelPage).toBeVisible()

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/joinCommunity",
        "Network/setLoadingPanelType",
        "Communities/setInvitationCodes",
        "Modals/openModal",
        "Modals/closeModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "PublicChannels/channelsReplicated",
        "PublicChannels/setChannelSubscribed",
        "PublicChannels/addChannel",
        "Messages/addPublicChannelsMessagesBase",
        "PublicChannels/sendIntroductionMessage",
        "Modals/openModal",
        "Modals/closeModal",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Identity/addNewIdentity",
        "Users/setUserProfile",
        "Communities/launchCommunity",
        "Communities/clearInvitationCodes",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/retryVerification",
        "Messages/verifyMessages",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/retryVerification",
        "Messages/verifyMessages",
        "Communities/setCurrentCommunity",
        "Files/checkForMissingFiles",
        "Network/addInitializedCommunity",
      ]
    `)
  })

  // We don't display registration errors right now
  it.skip('sees proper registration error when trying to join with already taken username', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))

    renderComponent(
      <>
        <LoadingPanel />
        <JoinCommunity />
        <CreateUsername />
        <Channel />
      </>,
      store
    )

    const mockEmitImpl = async (...input: [SocketActions, ...socketEventData<[any]>]) => {
      const action = input[0]
    }

    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    // Confirm proper modal title is displayed
    const dictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(dictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const joinCommunityButton = screen.getByText(dictionary.button)
    await userEvent.type(joinCommunityInput, validCode)
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    await userEvent.type(createUsernameInput, 'bob')
    await userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if 'username taken' error message is visible
    expect(createUsernameTitle).toBeVisible()
    const usernameTakenErrorMessage = await screen.findByText(ErrorMessages.USERNAME_TAKEN)
    expect(usernameTakenErrorMessage).toBeVisible()

    expect(actions).toMatchInlineSnapshot()
  })
})

describe('join community - qss', () => {
  const OLD_ENV = process.env
  let socket: MockedSocket

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV, QSS_ALLOWED: 'true' }
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })
  afterEach(() => {
    process.env = OLD_ENV
  })

  it('shows terms of service if joining community with qss', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
        <TermsOfService />
        <LoadingPanel />
      </>,
      store
    )

    store.dispatch(socketActions.setConnected())

    const mockEmitImpl = makeMockEmitImpl(socket, { qss: true })

    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action: AnyAction = yield* take()
        actions.push(action.type)
      }
    })

    const { code } = getValidInvitationUrlTestData(validInvitationDatav3[0])
    const qssCode = code()
    logger.info('Using qss invitation code:', qssCode)

    const joinDictionary = JoinCommunityDictionary()
    const joinInput = screen.getByPlaceholderText(joinDictionary.placeholder)
    const joinButton = screen.getByText(joinDictionary.button)
    await userEvent.type(joinInput, qssCode)
    expect(joinInput).toHaveValue(qssCode)
    await userEvent.click(joinButton)

    // complete username registration
    const usernameInput = await screen.findByPlaceholderText('Enter a username')
    await userEvent.type(usernameInput, 'alice')
    const registerButton = screen.getByText('Register')
    await userEvent.click(registerButton)

    // ToS should appear
    expect(await screen.findByTestId('TermOfService-UseQuietServer')).toBeVisible()
  })

  it('user chooses Agree & Join and then joining loading panel is shown', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
        <TermsOfService />
        <LoadingPanel />
      </>,
      store
    )

    store.dispatch(socketActions.setConnected())

    const mockEmitImpl = makeMockEmitImpl(socket, { qss: true })
    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl

    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action: AnyAction = yield* take()
        actions.push(action.type)
      }
    })

    const { code } = getValidInvitationUrlTestData(validInvitationDatav3[0])
    const qssCode = code()
    const joinDictionary = JoinCommunityDictionary()
    await userEvent.type(screen.getByPlaceholderText(joinDictionary.placeholder), qssCode)
    await userEvent.click(screen.getByText(joinDictionary.button))
    await userEvent.type(await screen.findByPlaceholderText('Enter a username'), 'alice')
    await userEvent.click(screen.getByText('Register'))

    const agree = await screen.findByTestId('TermOfService-UseQuietServer')
    await userEvent.click(agree)

    expect(await screen.findByTestId('joiningPanelComponent')).toBeVisible()
  })

  it('user chooses Leave Community and the ui returns to join community', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
        <TermsOfService />
        <LoadingPanel />
      </>,
      store
    )

    store.dispatch(socketActions.setConnected())

    const mockEmitImpl = makeMockEmitImpl(socket, { qss: true })
    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl

    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action: AnyAction = yield* take()
        actions.push(action.type)
      }
    })

    const { code } = getValidInvitationUrlTestData(validInvitationDatav3[0])
    const qss = code()
    const joinDictionary = JoinCommunityDictionary()
    // Confirm proper modal title is displayed
    const joinCommunityTitle = screen.getByText(joinDictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(joinDictionary.placeholder)
    const joinCommunityButton = screen.getByText(joinDictionary.button)
    await userEvent.type(joinCommunityInput, qss)
    await userEvent.click(joinCommunityButton)

    await userEvent.type(await screen.findByPlaceholderText('Enter a username'), 'alice')
    await userEvent.click(screen.getByText('Register'))

    const abort = await screen.findByTestId('TermOfService-Abort')
    await userEvent.click(abort)

    const joinTitle = await screen.findByText(joinDictionary.header)
    expect(joinTitle).toBeVisible()
  })
})
