import { generateChannelId } from '@quiet/common'
import { publicChannels, getSocketFactory, getBaseTypesFactory } from '@quiet/state-manager'
import {
  SocketActions,
  SocketEvents,
  socketEventData,
  ChannelsReplicatedPayload,
  InitCommunityPayload,
  ResponseLaunchCommunityPayload,
  ResponseCreateCommunityPayload,
  CommunityOwnership,
} from '@quiet/types'
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { AnyAction } from 'redux'
import MockedSocket from 'socket.io-mock'
import { take } from 'typed-redux-saga'
import Channel from '../renderer/components/Channel/Channel'
import CreateCommunity from '../renderer/components/CreateJoinCommunity/CreateCommunity/CreateCommunity'
import { CreateCommunityDictionary } from '../renderer/components/CreateJoinCommunity/community.dictionary'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import LoadingPanel from '../renderer/components/LoadingPanel/LoadingPanel'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { ioMock } from '../shared/setupTests'
import { FactoryGirl } from 'factory-girl'

jest.setTimeout(20_000)

describe('User', () => {
  let socket: MockedSocket
  const generalId = generateChannelId('general')

  let factory: FactoryGirl
  let baseTypesFactory: FactoryGirl

  beforeEach(async () => {
    factory = await getSocketFactory()
    baseTypesFactory = await getBaseTypesFactory()
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('creates community and registers username', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.createCommunityModal }))

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <LoadingPanel />
        <CreateCommunity />
        <CreateUsername />
        <Channel />
      </>,
      store
    )

    const mockEmitImpl = async (...input: [SocketActions, ...socketEventData<[any]>]) => {
      const action = input[0]
      if (action === SocketActions.CREATE_COMMUNITY) {
        return await factory.build(`${action}_response`, {
          id: input[1].id,
          community: await baseTypesFactory.build('Community', { id: input[1].id, name: input[1].name }),
          identity: await baseTypesFactory.build('Identity', {
            communityId: input[1].id,
            userId: 'commonUserId',
          }),
          profile: await baseTypesFactory.build('UserProfile', {
            userId: input[1].id,
          }),
        })
      } else if (action === SocketActions.CREATE_CHANNEL) {
        return await factory.build(`${action}_response`, {
          channel: baseTypesFactory.build('PublicChannel', { ...input[1] }),
        })
      }
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
    const dictionary = CreateCommunityDictionary()
    const createCommunityTitle = screen.getByText(dictionary.header)
    expect(createCommunityTitle).toBeVisible()

    // Enter community name and hit button
    const createCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const createCommunityButton = screen.getByText(dictionary.button)
    await userEvent.type(createCommunityInput, 'rockets')
    await userEvent.click(createCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = await screen.findByPlaceholderText('Enter a username')
    const createUsernameButton = await screen.findByText('Register')
    await userEvent.type(createUsernameInput, 'alice')
    await userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {
      // Little workaround
      store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: generalId }))
    })

    // Check if create/username modals are gone
    expect(createCommunityTitle).not.toBeVisible()
    expect(createUsernameTitle).not.toBeVisible()

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/createCommunity",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Modals/closeModal",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Network/setLoadingPanelType",
        "Modals/openModal",
        "Communities/updateCommunityData",
        "Identity/addNewIdentity",
        "Users/setUserProfile",
        "PublicChannels/createGeneralChannel",
        "PublicChannels/createChannel",
        "Communities/launchCommunity",
        "PublicChannels/setCurrentChannel",
        "Communities/setCurrentCommunity",
        "PublicChannels/clearUnreadChannel",
        "Files/checkForMissingFiles",
        "Network/addInitializedCommunity",
        "Modals/closeModal",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/addPublicChannelsMessagesBase",
        "PublicChannels/addChannel",
        "PublicChannels/sendInitialChannelMessage",
        "PublicChannels/finishGeneralRecreation",
        "Messages/sendMessage",
        "Messages/addMessagesSendingStatus",
        "Messages/addMessageVerificationStatus",
        "Messages/addMessages",
        "PublicChannels/cacheMessages",
        "Messages/addMessageVerificationStatus",
        "Identity/verifyJoinTimestamp",
        "PublicChannels/updateNewestMessage",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/clearUnreadChannel",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/resetCurrentPublicChannelCache",
      ]
    `)
  })
})
