import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import CreateCommunity from '../renderer/components/CreateJoinCommunity/CreateCommunity/CreateCommunity'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { CreateCommunityDictionary } from '../renderer/components/CreateJoinCommunity/community.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import {
  Community,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  publicChannels,
  RegisterOwnerCertificatePayload,
  SocketActionTypes
} from '@quiet/state-manager'
import Channel from '../renderer/components/Channel/Channel'
import LoadingPanel from '../renderer/components/LoadingPanel/LoadingPanel'
import { generateChannelId } from '@quiet/common'

jest.setTimeout(20_000)

describe('User', () => {
  let socket: MockedSocket
  const generalId = generateChannelId('general')

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
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

    jest.spyOn(socket, 'emit').mockImplementation((action: SocketActionTypes, ...input: any[]) => {
      if (action === SocketActionTypes.CREATE_NETWORK) {
        const data = input as socketEventData<[Community]>
        const payload = { ...data[0], privateKey: 'privateKey' }
        socket.socketClient.emit(SocketActionTypes.NETWORK, {
          community: payload,
          network: {
            hiddenService: {
              onionAddress: 'onionAddress',
              privKey: 'privKey'
            },
            peerId: {
              id: 'peerId'
            }
          }
        })
      }
      if (action === SocketActionTypes.REGISTER_OWNER_CERTIFICATE) {
        const data = input as socketEventData<[RegisterOwnerCertificatePayload]>
        const payload = data[0]
        socket.socketClient.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
          communityId: payload.communityId,
          network: {
            certificate: payload.permsData.certificate,
            peers: []
          }
        })
      }
      if (action === SocketActionTypes.CREATE_COMMUNITY) {
        const data = input as socketEventData<[InitCommunityPayload]>
        const payload = data[0]
        socket.socketClient.emit(SocketActionTypes.COMMUNITY, {
          id: payload.id
        })
        socket.socketClient.emit(SocketActionTypes.NEW_COMMUNITY, {
          id: payload.id
        })

        socket.socketClient.emit(SocketActionTypes.CHANNELS_REPLICATED, {
          communityId: payload.id,
          channels: {
            general: {
              name: 'general',
              description: 'string',
              owner: 'owner',
              timestamp: 0,
              id: generalId
            }
          }
        })
      }
      if (action === SocketActionTypes.LAUNCH_REGISTRAR) {
        const data = input as socketEventData<[LaunchRegistrarPayload]>
        const payload = data[0]
        socket.socketClient.emit(SocketActionTypes.REGISTRAR, {
          id: payload.id,
          peerId: payload.peerId,
          payload: {
            privateKey: 'privateKey',
            onionAddress: 'onionAddress',
            port: 7909
          }
        })
      }
    })

    // Log all the dispatched actions in order
    const actions = []
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

    // Check if channel page is visible
    const channelPage = await screen.findByText('#general')
    expect(channelPage).toBeVisible()
    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/createNetwork",
        "Communities/responseCreateNetwork",
        "Communities/clearInvitationCode",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Identity/addNewIdentity",
        "Modals/closeModal",
        "Modals/openModal",
        "Identity/registerUsername",
        "Network/setLoadingPanelType",
        "Modals/openModal",
        "Identity/registerCertificate",
        "Communities/addOwnerCertificate",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Identity/savedOwnerCertificate",
        "Communities/launchRegistrar",
        "Files/checkForMissingFiles",
        "Network/addInitializedCommunity",
        "Identity/saveOwnerCertToDb",
        "PublicChannels/createGeneralChannel",
        "PublicChannels/channelsReplicated",
        "Communities/responseRegistrar",
        "Network/addInitializedRegistrar",
        "PublicChannels/createChannel",
        "PublicChannels/addChannel",
        "PublicChannels/setCurrentChannel",
        "Messages/addPublicChannelsMessagesBase",
        "PublicChannels/clearUnreadChannel",
        "Modals/closeModal",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/resetCurrentPublicChannelCache",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/clearUnreadChannel",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/resetCurrentPublicChannelCache",
      ]
    `)
  })
})
