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
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { JoinCommunityDictionary } from '../renderer/components/CreateJoinCommunity/community.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import {
  identity,
  communities,
  SocketActionTypes,
  RegisterUserCertificatePayload,
  InitCommunityPayload,
  Community,
  ErrorCodes,
  ErrorMessages,
  getFactory,
  errors
} from '@quiet/state-manager'
import Channel from '../renderer/components/Channel/Channel'
import LoadingPanel from '../renderer/components/LoadingPanel/LoadingPanel'
import { createUserCertificateTestHelper } from '@quiet/identity'
import {AnyAction} from 'redux'

jest.setTimeout(20_000)

describe('User', () => {
  let socket: MockedSocket
  // trigger
  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
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

    const factory = await getFactory(store)

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (...input: any) => {
        const action = input[0] as SocketActionTypes
        if (action === SocketActionTypes.CREATE_NETWORK) {
          const data = input as socketEventData<[Community]>
          const payload = data[0]
          return socket.socketClient.emit(SocketActionTypes.NETWORK, {
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
        if (action === SocketActionTypes.REGISTER_USER_CERTIFICATE) {
          const data = input as socketEventData<[RegisterUserCertificatePayload]>
          const payload = data[0]
          const user = identity.selectors.currentIdentity(store.getState())
          expect(user).not.toBeUndefined()
          // This community serves only as a mocked object for generating valid crytpo data (certificate, rootCA)
          const communityHelper: ReturnType<typeof communities.actions.addNewCommunity>['payload'] =
            (
              await factory.build<typeof communities.actions.addNewCommunity>('Community', {
                id: data[0]
              })
            ).payload
          const certificateHelper = await createUserCertificateTestHelper(
            {
              // @ts-expect-error
              nickname: user.nickname,
              // @ts-expect-error
              commonName: communityHelper.registrarUrl,
              // @ts-expect-error
              peerId: user.peerId.id,
              // @ts-expect-error
              dmPublicKey: user.dmKeys.publicKey
            },
            communityHelper.CA
          )
          const certificate = certificateHelper.userCert.userCertObject.certificate
          const rootCa = communityHelper.CA?.rootCertString
          return socket.socketClient.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
            communityId: payload.communityId,
            payload: {
              certificate: certificate,
              rootCa: rootCa,
              peers: []
            }
          })
        }
        if (action === SocketActionTypes.LAUNCH_COMMUNITY) {
          const data = input as socketEventData<[InitCommunityPayload]>
          const payload = data[0]
          const community = communities.selectors.currentCommunity(store.getState())
          expect(payload.id).toEqual(community?.id)
          socket.socketClient.emit(SocketActionTypes.COMMUNITY, {
            id: payload.id
          })
          socket.socketClient.emit(SocketActionTypes.CHANNELS_REPLICATED, {
            communityId: community?.id,
            channels: {
              general: {
                name: 'general',
                description: 'string',
                owner: 'owner',
                timestamp: 0,
                id: 'general'
              }
            }
          })
        }
      })

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
    await userEvent.type(
      joinCommunityInput,
      '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd'
    )
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    await userEvent.type(createUsernameInput, 'alice')
    await userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if join/username modals are gone
    expect(joinCommunityTitle).not.toBeVisible()
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
        "Communities/updateCommunity",
        "Communities/updateCommunityData",
        "Communities/launchCommunity",
        "Communities/launchRegistrar",
        "Files/checkForMissingFiles",
        "Network/addInitializedCommunity",
        "PublicChannels/channelsReplicated",
        "PublicChannels/addChannel",
        "Messages/addPublicChannelsMessagesBase",
        "Modals/closeModal",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
        "Messages/resetCurrentPublicChannelCache",
      ]
    `)
  })

  it('sees proper registration error when trying to join with already taken username', async () => {
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

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (...input: any) => {
        const action = input[0] as SocketActionTypes
        if (action === SocketActionTypes.CREATE_NETWORK) {
          const data = input as socketEventData<[Community]>
          const payload = data[0]
          return socket.socketClient.emit(SocketActionTypes.NETWORK, {
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
        if (action === SocketActionTypes.REGISTER_USER_CERTIFICATE) {
          const data = input as socketEventData<[RegisterUserCertificatePayload]>
          const payload = data[0]
          const community = communities.selectors.currentCommunity(store.getState())
          expect(payload.communityId).toEqual(community?.id)
          socket.socketClient.emit(SocketActionTypes.ERROR, {
            type: SocketActionTypes.REGISTRAR,
            code: ErrorCodes.FORBIDDEN,
            message: ErrorMessages.USERNAME_TAKEN,
            community: community?.id
          })
        }
      })

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
    await userEvent.type(
      joinCommunityInput,
      '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd'
    )
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
        "Errors/handleError",
        "Errors/addError",
      ]
    `)
  })

  it('clears error before sending another username registration request', async () => {
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

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (...input: any) => {
        const action = input[0] as SocketActionTypes
        if (action === SocketActionTypes.CREATE_NETWORK) {
          const data = input as socketEventData<[Community]>
          const payload = data[0]
          return socket.socketClient.emit(SocketActionTypes.NETWORK, {
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
      })

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
    await userEvent.type(
      joinCommunityInput,
      '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd'
    )
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    await act(async () => {
      const community = communities.selectors.currentCommunity(store.getState())
      store.dispatch(
        errors.actions.addError({
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.USERNAME_TAKEN,
          community: community?.id
        })
      )
    })

    // Check if 'username taken' error message is visible
    expect(createUsernameTitle).toBeVisible()
    expect(await screen.findByText(ErrorMessages.USERNAME_TAKEN)).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    await userEvent.type(createUsernameInput, 'bob')
    await userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if 'username taken' error message disappeared
    expect(await screen.queryByText(ErrorMessages.USERNAME_TAKEN)).toBeNull()

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
        "Errors/addError",
        "Errors/clearError",
        "Identity/registerUsername",
        "Network/setLoadingPanelType",
        "Modals/openModal",
        "Identity/registerCertificate",
      ]
    `)
  })
})
