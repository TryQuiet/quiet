import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { SocketState } from '../../../sagas/socket/socket.slice'
import { ModalName } from '../../../sagas/modals/modals.types'
import { ModalsInitialState } from '../../../sagas/modals/modals.slice'
import JoinCommunity from './joinCommunity'
import CreateCommunity from '../createCommunity/createCommunity'
import { JoinCommunityDictionary, CreateCommunityDictionary } from '../../../components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import CreateUsernameModal from '../createUsernameModal/CreateUsername'
import LoadingPanelModal from '../loadingPanel/loadingPanel'
import { identity, communities, getFactory, Identity, identityAdapter, StoreKeys as NectarStoreKeys } from '@quiet/nectar'
import { LoadingMessages } from '../loadingPanel/loadingMessages'

describe('join community', () => {
  it('users switches from join to create', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true }
      }
    })

    renderComponent(
      <>
        <JoinCommunity />
        <CreateCommunity />
      </>,
      store
    )

    // Confirm proper modal title is displayed
    const joinCommunityDictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(joinCommunityDictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Click redirecting link
    const link = screen.getByTestId('JoinCommunityLink')
    userEvent.click(link)

    // Confirm user is being redirected to create community
    const createCommunityDictionary = CreateCommunityDictionary()
    const createCommunityTitle = await screen.findByText(createCommunityDictionary.header)
    expect(createCommunityTitle).toBeVisible()
  })

  it('user goes form joning community to username registration, then comes back', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true }
      }
    })

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsernameModal />
      </>,
      store
    )

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

    // Close username registration modal
    const closeButton = await screen.findByTestId('createUsernameModalActions')
    userEvent.click(closeButton)
    expect(joinCommunityTitle).toBeVisible()
  })

  it('user rejoins to remembered community without user data', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true }
      },
      [NectarStoreKeys.Communities]: {
        ...new communities.State()
      }
    })

    const factory = await getFactory(store)

    await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsernameModal />
      </>,
      store
    )

    const createUsernameTitle = screen.getByText('Register a username')
    expect(createUsernameTitle).toBeVisible()
  })

  it('user rejoins to remembered community with certificate', async () => {
    const factoryStore = (await prepareStore()).store
    const factory = await getFactory(factoryStore)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const identityAlpha: Identity = {
      id: community.id,
      nickname: 'nickname',
      hiddenService: {
        onionAddress: '',
        privateKey: ''
      },
      dmKeys: {
        publicKey: '',
        privateKey: ''
      },
      peerId: {
        id: '',
        pubKey: '',
        privKey: ''
      },
      userCsr: null,
      userCertificate: ''
    }

    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true }
      },
      [NectarStoreKeys.Communities]: factoryStore.getState().Communities,
      [NectarStoreKeys.Identity]: {
        ...new identity.State(),
        identities: identityAdapter.setAll(
          identityAdapter.getInitialState(),
          [identityAlpha]
        )
      }
    })

    const result1 = renderComponent(
      <>
        <JoinCommunity />
        <CreateUsernameModal />
        <LoadingPanelModal />
      </>,
      store
    )

    const switchLink1 = result1.queryByText(LoadingMessages.CreateCommunity)
    expect(switchLink1).not.toBeNull()

    store.dispatch(identity.actions.storeUserCertificate({
      userCertificate: 'userCert',
      communityId: community.id
    }))

    const result2 = renderComponent(
      <>
        <JoinCommunity />
        <CreateUsernameModal />
        <LoadingPanelModal />
      </>,
      store
    )

    const switchLink2 = result2.queryByText(LoadingMessages.CreateCommunity)
    expect(switchLink2).toBeNull()
  })
})
