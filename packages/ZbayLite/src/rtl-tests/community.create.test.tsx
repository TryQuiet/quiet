import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import CreateCommunity from '../renderer/containers/widgets/createCommunity/createCommunity'
import CreateUsernameModal from '../renderer/containers/widgets/createUsernameModal/CreateUsername'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { CreateCommunityDictionary } from '../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import { Identity, SocketActionTypes } from '@zbayapp/nectar'
import Channel from '../renderer/containers/pages/Channel'
import LoadingPanel from '../renderer/containers/widgets/loadingPanel/loadingPanel'
import { LoadingMessages } from '../renderer/containers/widgets/loadingPanel/loadingMessages'

const payload = (id: string): Partial<Identity> => ({
  id: id,
  hiddenService: {
    onionAddress: 'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd',
    privateKey:
      'ED25519-V3:eECPVkKQxx0SADnjaqAxheH797Q79D0DqGu8Pbc83mpfaZSujZdxqJ6r5ZwUDWCYAegWx2xNkMt7zUKXyxKOuQ=='
  },
  peerId: {
    id: 'QmPdB7oUGiDEz3oanj58Eba595H2dtNiKtW7bNTrBey5Az',
    privKey:
      'CAASqAkwggSkAgEAAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAECggEAXUbrwE2m9ONZdqLyMWJoNghsh+qbwbzXIDFmT4yXaa2qf2BExQPGZhDMlP5cyrKuxw0RX2DjrUWpBZ5evVdsBWZ5IXYNd4NST0G8/OsDqw5DIVQb19gF5wBlNnWCL7woMnukCOB/Dhul4x2AHo2STuanP7bQ8RrsAp4njAivZydZADv2Xo4+ll+CBquJOHRMjcIqXzaKLoXTf80euskHfizFT4cFsI6oZygx8yqstoz2SBj2Qr3hvkUmSBFhE+dChIRrpcYuuz0JPpUTBmGgCLdKarUJHH1GJ4+wc6YU9YmJJ3kqyR+h/oVGaB1j4YOd5ubtJAIvf7uj0Ofhq1FJhQKBgQDrgsrUAZCafk81HAU25EmfrvH0jbTvZ7LmM86lntov8viOUDVk31F3u+CWGP7L/UomMIiveqO8J9OpQCvK8/AgIahtcB6rYyyb7XGLBn+njfVzdg8e2S4G91USeNuugYtwgpylkotOaAZrmiLgl415UgJvhAaOf+sMzV5xLREWMwKBgQCg+9iU7rDpgx8Tcd9tf5hGCwK9sorC004ffxtMXa+nN1I+gCfQH9eypFbmVnAo6YRQS02sUr9kSfB1U4f7Hk1VH/Wu+nRJNdTfz4uV5e65dSIo3kga8aTZ8YTIlqtDwcVv0GDCxDcstpdmR3scua0p2Oq22cYrmHOBgSGgdX0mewKBgQCPm/rImoet3ZW5IfQAC+blK424/Ww2jDpn63F4Rsxvbq6oQTq93vtTksoZXPaKN1KuxOukbZlIU9TaoRnTMTrcrQmCalsZUWlTT8/r4bOX3ZWtqXEA85gAgXNrxyzWVYJMwih5QkoWLpKzrJLV9zQ6pYp8q7o/zLrs3JJZWwzPRwKBgDrHWfAfKvdICfu2k0bO1NGWSZzr6OBz+M1lQplih7U9bMknT+IdDkvK13Po0bEOemI67JRj7j/3A1ZDdp4JFWFkdvc5uWXVwvEpPaUwvDZ4/0z+xEMaQf/VwI7g/I2T3bwS0JGsxRyNWsBcjyYQ4Zoq+qBi6YmXc20wsg99doGrAoGBAIXD8SW9TNhbo3uGK0Tz7y8bdYT4M9krM53M7I62zU6yLMZLTZHX1qXjbAFhEU5wVm6Mq0m83r1fiwnTrBQbn1JBtEIaxCeQ2ZH7jWmAaAOQ2z3qrHenD41WQJBzpWh9q/tn9JKD1KiWykQDfEnMgBt9+W/g3VgAF+CnR+feX6aH',
    pubKey:
      'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAE='
  }
})

describe('User', () => {
  let socket: MockedSocket
  let communityId: string
  let payloadData: Partial<Identity>

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('creates community and registers username', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.createCommunityModal }))

    renderComponent(
      <>
        <CreateCommunity />
        <CreateUsernameModal />
        <Channel />
      </>,
      store
    )

    jest.spyOn(socket, 'emit').mockImplementation((action: SocketActionTypes, ...input: any[]) => {
      if (action === SocketActionTypes.CREATE_NETWORK) {
        const data = input as socketEventData<[string]>
        const id = data[0]
        payloadData = payload(id)
        socket.socketClient.emit(SocketActionTypes.NETWORK, {
          id: id,
          payload: {
            hiddenService: payloadData.hiddenService,
            peerId: payloadData.peerId
          }
        })
      }
      if (action === SocketActionTypes.REGISTER_OWNER_CERTIFICATE) {
        const data = input as socketEventData<
        [string, string, { certificate: string; privKey: string }]
        >
        communityId = data[0]
        const CA = data[2]
        socket.socketClient.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
          id: communityId,
          payload: {
            certificate: CA.certificate,
            peers: [],
            rootCa: 'rootCa'
          }
        })
      }
      if (action === SocketActionTypes.CREATE_COMMUNITY) {
        const data = input as socketEventData<[string, {}, {}, {}]>
        const id = data[0]
        expect(id).toEqual(communityId)
        socket.socketClient.emit(SocketActionTypes.COMMUNITY, {
          id
        })
        socket.socketClient.emit(SocketActionTypes.NEW_COMMUNITY, {
          id
        })
        socket.socketClient.emit(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
          communityId: communityId,
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
      if (action === SocketActionTypes.LAUNCH_REGISTRAR) {
        const data = input as socketEventData<[string, string, string, string]>
        const id = data[0]
        const peerId = data[1]
        expect(id).toEqual(communityId)
        expect(peerId).toEqual(payloadData.peerId.id)
        socket.socketClient.emit(SocketActionTypes.REGISTRAR, {
          id: id,
          peerId: peerId,
          payload: {
            privateKey: payloadData.hiddenService.privateKey,
            onionAddress: payloadData.hiddenService.onionAddress,
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
    userEvent.type(createCommunityInput, 'rockets')
    userEvent.click(createCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = await screen.findByPlaceholderText('Enter a username')
    const createUsernameButton = await screen.findByText('Register')
    userEvent.type(createUsernameInput, 'alice')
    userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if create/username modals are gone
    expect(createCommunityTitle).not.toBeVisible()
    expect(createUsernameTitle).not.toBeVisible()

    // Check if channel page is visible
    const channelPage = await screen.findByText('#general')
    expect(channelPage).toBeVisible()
    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/createNewCommunity",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Communities/updateCommunity",
        "Identity/savedOwnerCertificate",
        "Communities/launchRegistrar",
        "Connection/addInitializedCommunity",
        "PublicChannels/createGeneralChannel",
        "PublicChannels/responseGetPublicChannels",
        "PublicChannels/subscribeToAllTopics",
        "Communities/responseRegistrar",
        "Connection/addInitializedRegistrar",
        "Identity/saveOwnerCertToDb",
        "PublicChannels/createChannel",
        "PublicChannels/subscribeToTopic",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/addChannel",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
      ]
    `)
  })

  it('cannot see general channel until communities are initialized', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.createCommunityModal }))

    renderComponent(
      <>
        <CreateCommunity />
        <CreateUsernameModal />
        <LoadingPanel />
        <Channel />
      </>,
      store
    )

    jest.spyOn(socket, 'emit').mockImplementation((action: SocketActionTypes, ...input: any[]) => {
      if (action === SocketActionTypes.CREATE_NETWORK) {
        const data = input as socketEventData<[string]>
        const id = data[0]
        payloadData = payload(id)
        socket.socketClient.emit(SocketActionTypes.NETWORK, {
          id: id,
          payload: {
            hiddenService: payloadData.hiddenService,
            peerId: payloadData.peerId
          }
        })
      }
      if (action === SocketActionTypes.REGISTER_OWNER_CERTIFICATE) {
        const data = input as socketEventData<
        [string, string, { certificate: string; privKey: string }]
        >
        communityId = data[0]
        const CA = data[2]
        socket.socketClient.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
          id: communityId,
          payload: {
            certificate: CA.certificate,
            peers: [],
            rootCa: 'rootCa'
          }
        })
      }
      if (action === SocketActionTypes.CREATE_COMMUNITY) {
        const data = input as socketEventData<[string, {}, {}, {}]>
        const id = data[0]
        expect(id).toEqual(communityId)
        socket.socketClient.emit(SocketActionTypes.NEW_COMMUNITY, {
          id
        })
        socket.socketClient.emit(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
          communityId: communityId,
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
      if (action === SocketActionTypes.LAUNCH_REGISTRAR) {
        const data = input as socketEventData<[string, string, string, string]>
        const id = data[0]
        const peerId = data[1]
        expect(id).toEqual(communityId)
        expect(peerId).toEqual(payloadData.peerId.id)
        socket.socketClient.emit(SocketActionTypes.REGISTRAR, {
          id: id,
          peerId: peerId,
          payload: {
            privateKey: payloadData.hiddenService.privateKey,
            onionAddress: payloadData.hiddenService.onionAddress,
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
        console.log('Action:', action)
      }
    })

    // Confirm proper modal title is displayed
    const dictionary = CreateCommunityDictionary()
    const createCommunityTitle = screen.getByText(dictionary.header)
    expect(createCommunityTitle).toBeVisible()

    // Enter community name and hit button
    const createCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const createCommunityButton = screen.getByText(dictionary.button)
    userEvent.type(createCommunityInput, 'rockets')
    userEvent.click(createCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = await screen.findByPlaceholderText('Enter a username')
    const createUsernameButton = await screen.findByText('Register')
    userEvent.type(createUsernameInput, 'alice')
    userEvent.click(createUsernameButton)

    // Wait for the actions that updates the store
    await act(async () => {})

    // Check if 'creating community' loading panel is displayed
    await waitFor(() => {
      expect(screen.getByText(LoadingMessages.CreateCommunity)).toBeInTheDocument()
    })

    // General channel should be hidden
    // Note: channel view is present in the DOM but hidden by aria-hidden so getByRole is currently
    // the only way to check this kind of visibility.
    await waitFor(() => {
      expect(screen.getByRole('heading', {
        name: /#general/i,
        hidden: true
      })).toBeInTheDocument()
    })

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/createNewCommunity",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Communities/updateCommunity",
        "Identity/savedOwnerCertificate",
        "PublicChannels/createGeneralChannel",
        "PublicChannels/responseGetPublicChannels",
        "PublicChannels/subscribeToAllTopics",
        "PublicChannels/createChannel",
        "PublicChannels/subscribeToTopic",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/addChannel",
      ]
    `)
  })
})
