import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { SocketState } from '../../../sagas/socket/socket.slice'
import { ModalName } from '../../../sagas/modals/modals.types'
import { modalsActions, ModalsInitialState } from '../../../sagas/modals/modals.slice'
import CreateUsernameModal from '../createUsernameModal/CreateUsername'
import JoinCommunity from '../joinCommunity/joinCommunity'
import CreateCommunity from './createCommunity'
import { CreateCommunityDictionary, JoinCommunityDictionary } from '../../../components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import { identity, communities, StoreKeys as NectarStoreKeys, getFactory } from '@zbayapp/nectar'

describe('Create community', () => {
  it('users switches from create to join', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.createCommunityModal]: { open: true }
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
    const createCommunityDictionary = CreateCommunityDictionary()
    const createCommunityTitle = screen.getByText(createCommunityDictionary.header)
    expect(createCommunityTitle).toBeVisible()

    // Click redirecting link
    const link = screen.getByTestId('CreateCommunityLink')
    userEvent.click(link)

    // Confirm user is being redirected to join community
    const joinCommunityDictionary = JoinCommunityDictionary()
    const joinCommunityTitle = await screen.findByText(joinCommunityDictionary.header)
    expect(joinCommunityTitle).toBeVisible()
  })

  it('user goes form creating community to username registration, then comes back', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.createCommunityModal]: { open: true }
      },
      [NectarStoreKeys.Communities]: {
        ...new communities.State()
      },
      [NectarStoreKeys.Identity]: {
        ...new identity.State()
      }
    })

    renderComponent(
      <>
        <CreateCommunity />
        <CreateUsernameModal />
      </>,
      store
    )

    // Confirm proper modal title is displayed
    const dictionary = CreateCommunityDictionary()
    const createCommunityTitle = screen.getByText(dictionary.header)
    expect(createCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const createCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const createCommunityButton = screen.getByText(dictionary.button)
    userEvent.type(createCommunityInput, 'rockets')
    userEvent.click(createCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Close username registration modal
    const closeButton = await screen.findByTestId('createUsernameModalActions')
    userEvent.click(closeButton)
    expect(createCommunityTitle).toBeVisible()
  })

  it('user tries to create again a remembered community', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState()
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
        <CreateCommunity />
        <CreateUsernameModal />
      </>,
      store
    )
    store.dispatch(modalsActions.openModal({ name: ModalName.createCommunityModal }))
    const createUsernameTitle = screen.getByText('Register a username')
    expect(createUsernameTitle).toBeVisible()
  })
})
