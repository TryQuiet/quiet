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
})
