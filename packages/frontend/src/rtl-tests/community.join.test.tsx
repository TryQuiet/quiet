import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import JoinCommunity from '../renderer/containers/widgets/joinCommunity/joinCommunity'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import LoadingPanel from '../renderer/containers/widgets/loadingPanel/loadingPanel'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { JoinCommunityDictionary } from '../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import {
  identity,
  communities,
  getFactory,
  SocketActionTypes,
  RegisterUserCertificatePayload,
  InitCommunityPayload,
  Identity,
  Community,
  createUserCertificateTestHelper,
  ErrorCodes,
  ErrorMessages
} from '@quiet/nectar'
import Channel from '../renderer/components/Channel/Channel'

jest.setTimeout(20_000)

describe('User', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('joins community and registers username', async () => {
    let community: Community
    let alice: Identity

    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
        <Channel />
      </>,
      store
    )

    const factory = await getFactory(store)

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (action: SocketActionTypes, ...input: any[]) => {
        if (action === SocketActionTypes.CREATE_NETWORK) {
          const data = input as socketEventData<[string]>
          community = (
            await factory.build<typeof communities.actions.addNewCommunity>('Community', {
              id: data[0]
            })
          ).payload
          alice = (
            await factory.build<typeof identity.actions.addNewIdentity>('Identity', {
              id: community.id,
              nickname: 'alice'
            })
          ).payload

          return socket.socketClient.emit(SocketActionTypes.NETWORK, {
            id: community.id,
            payload: {
              hiddenService: alice.hiddenService,
              peerId: alice.peerId
            }
          })
        }
        if (action === SocketActionTypes.REGISTER_USER_CERTIFICATE) {
          const data = input as socketEventData<[RegisterUserCertificatePayload]>
          const payload = data[0]
          expect(payload.id).toEqual(community.id)
          const certificate = await createUserCertificateTestHelper(
            {
              nickname: alice.nickname,
              commonName: alice.hiddenService.onionAddress,
              peerId: alice.peerId.id
            },
            community.CA
          )
          return socket.socketClient.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
            id: payload.id,
            payload: {
              certificate: certificate,
              rootCa: community.CA.rootCertString
            }
          })
        }
        if (action === SocketActionTypes.LAUNCH_COMMUNITY) {
          const data = input as socketEventData<[InitCommunityPayload]>
          const payload = data[0]
          expect(payload.id).toEqual(community.id)
          socket.socketClient.emit(SocketActionTypes.COMMUNITY, {
            id: payload.id
          })
          socket.socketClient.emit(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
            communityId: community.id,
            channels: {
              general: {
                name: 'general',
                description: 'string',
                owner: 'owner',
                timestamp: 0,
                address: 'general'
              }
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
    const dictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(dictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const joinCommunityButton = screen.getByText(dictionary.button)
    userEvent.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd')
    userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    userEvent.type(createUsernameInput, 'alice')
    userEvent.click(createUsernameButton)

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
        "Modals/openModal",
        "Modals/openModal",
        "Communities/joinCommunity",
        "Communities/addNewCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/setCurrentCommunity",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Communities/updateCommunity",
        "Communities/updateCommunityData",
        "Communities/launchCommunity",
        "Communities/launchRegistrar",
        "Connection/addInitializedCommunity",
        "PublicChannels/responseGetPublicChannels",
        "PublicChannels/subscribeToAllTopics",
        "PublicChannels/subscribeToTopic",
        "PublicChannels/addChannel",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
      ]
    `)
  })

  it('sees proper registration error when trying to join with already used username', async () => {
    let community: Community
    let alice: Identity

    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
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

    const factory = await getFactory(store)

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (action: SocketActionTypes, ...input: any[]) => {
        if (action === SocketActionTypes.CREATE_NETWORK) {
          const data = input as socketEventData<[string]>
          community = (
            await factory.build<typeof communities.actions.addNewCommunity>('Community', {
              id: data[0]
            })
          ).payload
          alice = (
            await factory.build<typeof identity.actions.addNewIdentity>('Identity', {
              id: community.id,
              nickname: 'alice'
            })
          ).payload
          return socket.socketClient.emit(SocketActionTypes.NETWORK, {
            id: community.id,
            payload: {
              hiddenService: alice.hiddenService,
              peerId: alice.peerId
            }
          })
        }
        if (action === SocketActionTypes.REGISTER_USER_CERTIFICATE) {
          const data = input as socketEventData<[RegisterUserCertificatePayload]>
          const payload = data[0]
          expect(payload.id).toEqual(community.id)
          socket.socketClient.emit(SocketActionTypes.ERROR, {
            type: SocketActionTypes.REGISTRAR,
            message: ErrorMessages.USERNAME_TAKEN,
            code: ErrorCodes.VALIDATION,
            community: community.id
          })
        }
        if (action === SocketActionTypes.LAUNCH_COMMUNITY) {
          const data = input as socketEventData<[InitCommunityPayload]>
          const payload = data[0]
          expect(payload.id).toEqual(community.id)
          socket.socketClient.emit(SocketActionTypes.COMMUNITY, {
            id: payload.id
          })
          socket.socketClient.emit(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
            communityId: community.id,
            channels: {
              general: {
                name: 'general',
                description: 'string',
                owner: 'owner',
                timestamp: 0,
                address: 'general'
              }
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
    const dictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(dictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const joinCommunityButton = screen.getByText(dictionary.button)
    userEvent.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd')
    userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    userEvent.type(createUsernameInput, 'bob')
    userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if 'username taken' error message is visible
    expect(createUsernameTitle).toBeVisible()
    const usernameTakenErrorMessage = await screen.findByText(ErrorMessages.USERNAME_TAKEN)
    expect(usernameTakenErrorMessage).toBeVisible()

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/joinCommunity",
        "Communities/addNewCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/setCurrentCommunity",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Errors/addError",
        "Modals/closeModal",
      ]
    `)
  })
})
