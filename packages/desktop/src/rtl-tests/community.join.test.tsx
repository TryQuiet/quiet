import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import GetStarted from '../renderer/components/Onboarding/GetStarted'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import { ModalName } from '../renderer/sagas/modals/modals.types'
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
  InitCommunityPayload,
  ErrorMessages,
  ResponseJoinCommunityPayload,
  CommunityOwnership,
  type InvitationAuthDataV4,
} from '@quiet/types'
import { composeInvitationShareUrl, getValidInvitationUrlTestData, validInvitationDatav5 } from '@quiet/common'
import { communities } from '@quiet/state-manager'

import { createLogger } from './logger'
import { socketActions } from '../renderer/sagas/socket/socket.slice'

const logger = createLogger('community.join.test')

/** Three-way choice → Open invite link → Paste a link, returning the link input. */
const openPasteStep = async () => {
  await userEvent.click(await screen.findByTestId('join-with-invite-link'))
  await userEvent.click(await screen.findByTestId('paste-a-link'))
  return await screen.findByPlaceholderText('Link')
}

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
              public: true,
              teamId: 'foobar',
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
            teamId: 'abc456',
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
    version: InvitationDataVersion.v4,
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
      teamId: 'abc123',
    } as InvitationAuthDataV4,
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

    const mockEmitImpl = jest.fn(makeMockEmitImpl(socket))

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
    const joinCommunityTitle = screen.getByRole('heading', { name: 'Join community', level: 3 })
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = await openPasteStep()
    const joinCommunityButton = screen.getByTestId('continue-joinCommunity')
    await userEvent.type(joinCommunityInput, validCode)
    expect(joinCommunityInput).toHaveValue(validCode)
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Choose username')
    expect(createUsernameTitle).toBeVisible()
    expect(communities.selectors.pendingJoin(store.getState())).toMatchObject({
      status: 'draft',
      inviteData: validData,
    })

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Username')
    const createUsernameButton = screen.getByTestId('continue-createUsername')
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
    const channelPage = await screen.findByText('general')
    expect(channelPage).toBeVisible()
    const joinRequests = mockEmitImpl.mock.calls.filter(([action]) => action === SocketActions.JOIN_COMMUNITY)
    expect(joinRequests).toHaveLength(1)
    expect(joinRequests[0][1]).toMatchObject({ username: 'alice', inviteData: validData })
    expect(communities.selectors.pendingJoin(store.getState())).toBeNull()

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/joinCommunity",
        "Communities/setPendingJoinId",
        "Network/setLoadingPanelType",
        "Modals/openModal",
        "Modals/closeModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/submitPendingJoin",
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
    const joinCommunityTitle = screen.getByRole('heading', { name: 'Join community', level: 3 })
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = await openPasteStep()
    const joinCommunityButton = screen.getByTestId('continue-joinCommunity')
    await userEvent.type(joinCommunityInput, validCode)
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Choose username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Username')
    const createUsernameButton = screen.getByTestId('continue-createUsername')
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
        <GetStarted />
        <JoinCommunity />
        <CreateUsername />
        <TermsOfService />
        <LoadingPanel />
      </>,
      store
    )

    store.dispatch(socketActions.setConnected())
    await userEvent.click(await screen.findByTestId('get-started-join'))

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

    const { code } = getValidInvitationUrlTestData(validInvitationDatav5[0])
    const qssCode = code()
    logger.info('Using qss invitation code:', qssCode)

    const joinInput = await openPasteStep()
    const joinButton = screen.getByTestId('continue-joinCommunity')
    await userEvent.type(joinInput, qssCode)
    expect(joinInput).toHaveValue(qssCode)
    await userEvent.click(joinButton)

    // complete username registration
    const usernameInput = await screen.findByPlaceholderText('Username')
    await userEvent.type(usernameInput, 'alice')
    const registerButton = screen.getByTestId('continue-createUsername')
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
        <GetStarted />
        <JoinCommunity />
        <CreateUsername />
        <TermsOfService />
        <LoadingPanel />
      </>,
      store
    )

    store.dispatch(socketActions.setConnected())
    await userEvent.click(await screen.findByTestId('get-started-join'))

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

    const { code } = getValidInvitationUrlTestData(validInvitationDatav5[0])
    const qssCode = code()
    await userEvent.type(await openPasteStep(), qssCode)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))
    await userEvent.type(await screen.findByPlaceholderText('Username'), 'alice')
    await userEvent.click(screen.getByTestId('continue-createUsername'))

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
        <GetStarted />
        <JoinCommunity />
        <CreateUsername />
        <TermsOfService />
        <LoadingPanel />
      </>,
      store
    )

    store.dispatch(socketActions.setConnected())
    await userEvent.click(await screen.findByTestId('get-started-join'))

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

    const { code } = getValidInvitationUrlTestData(validInvitationDatav5[0])
    const qss = code()
    // Confirm proper modal title is displayed
    const joinCommunityTitle = await screen.findByRole('heading', { name: 'Join community', level: 3 })
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = await openPasteStep()
    const joinCommunityButton = screen.getByTestId('continue-joinCommunity')
    await userEvent.type(joinCommunityInput, qss)
    await userEvent.click(joinCommunityButton)

    await userEvent.type(await screen.findByPlaceholderText('Username'), 'alice')
    await userEvent.click(screen.getByTestId('continue-createUsername'))

    const abort = await screen.findByTestId('TermOfService-Abort')
    await userEvent.click(abort)

    const joinTitle = await screen.findByRole('heading', { name: 'Join community', level: 3 })
    expect(joinTitle).toBeVisible()
  })
})
