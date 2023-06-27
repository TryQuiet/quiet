import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import { act } from 'react-dom/test-utils'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { SocketState } from '../../../sagas/socket/socket.slice'
import { ModalName } from '../../../sagas/modals/modals.types'
import { ModalsInitialState } from '../../../sagas/modals/modals.slice'
import CreateUsername from '../../CreateUsername/CreateUsername'
import JoinCommunity from '../JoinCommunity/JoinCommunity'
import CreateCommunity from './CreateCommunity'
import { CreateCommunityDictionary, JoinCommunityDictionary } from '../community.dictionary'
import { CommunityNameErrors, FieldErrors } from '../../../forms/fieldsErrors'
import PerformCommunityActionComponent from '../PerformCommunityActionComponent'
import { identity, communities, StoreKeys as StateManagerStoreKeys } from '@quiet/state-manager'
import { CommunityOwnership } from '@quiet/types'
import { communityNameField } from '../../../forms/fields/communityFields'

describe('Create community', () => {
  it('users switches from create to join', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true,
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.createCommunityModal]: { open: true },
      },
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
    await userEvent.click(link)

    // Confirm user is being redirected to join community
    const joinCommunityDictionary = JoinCommunityDictionary()
    const joinCommunityTitle = await screen.findByText(joinCommunityDictionary.header)
    expect(joinCommunityTitle).toBeVisible()
  })

  it.skip('user goes from creating community to username registration, then comes back', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true,
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.createCommunityModal]: { open: true },
      },
      [StateManagerStoreKeys.Communities]: {
        ...new communities.State(),
      },
      [StateManagerStoreKeys.Identity]: {
        ...new identity.State(),
      },
    })

    renderComponent(
      <>
        <CreateCommunity />
        <CreateUsername />
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
    await userEvent.type(createCommunityInput, 'rockets')
    await userEvent.click(createCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Close username registration modal
    const closeButton = await screen.findByTestId('createUsernameModalActions')
    await userEvent.click(closeButton)
    expect(createCommunityTitle).toBeVisible()
  })

  it('creates community on submit if connection is ready', async () => {
    const handleCommunityAction = jest.fn()
    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )
    const result = renderComponent(component)
    const communityName = 'communityname'
    const textInput = result.queryByPlaceholderText('Community name')
    expect(textInput).not.toBeNull()
    // @ts-expect-error
    await userEvent.type(textInput, communityName)
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeEnabled()
    // @ts-expect-error
    await userEvent.click(submitButton)
    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(communityName))
  })

  it.each([
    ['double-hyp--hens', 'double-hyp-hens'],
    ['-start-with-hyphen', 'start-with-hyphen'],
    [' start-with-space', 'start-with-space'],
    ['end-with-hyphen-', 'end-with-hyphen'],
    ['end-with-space ', 'end-with-space'],
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
  ])('user inserting wrong community name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
    renderComponent(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={() => {}}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const input = screen.getByPlaceholderText('Community name')

    await userEvent.type(input, name)
    expect(screen.getByTestId('createCommunityNameWarning')).toHaveTextContent(
      `Your community will be created as #${corrected}`
    )
  })

  it.each([
    ['   whitespaces', FieldErrors.Whitespaces],
    ['----hyphens', FieldErrors.Whitespaces],
    ['!@#', CommunityNameErrors.WrongCharacter],
    ['too-long-community-name', CommunityNameErrors.NameTooLong],
  ])('user inserting invalid community name "%s" should see "%s" error', async (name: string, error: string) => {
    const handleCommunityAction = jest.fn()

    renderComponent(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const input = screen.getByPlaceholderText('Community name')
    const button = screen.getByText('Continue')

    await userEvent.type(input, name)
    await userEvent.click(button)

    await waitFor(() => expect(handleCommunityAction).not.toBeCalled())

    const message = await screen.findByText(error)
    expect(message).toBeVisible()
  })

  it('blocks submit button if connection is not ready', async () => {
    const handleCommunityAction = jest.fn()

    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={false}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const result = renderComponent(component)

    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()
  })

  it('shows loading spinner on submit button while waiting for the response', async () => {
    const { rerender } = renderComponent(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={() => {}}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const textInput = screen.getByPlaceholderText(communityNameField().fieldProps.placeholder)
    await userEvent.type(textInput, 'rockets')

    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeEnabled()
    await userEvent.click(submitButton)

    await act(async () => {})

    expect(screen.queryByTestId('loading-button-progress')).toBeVisible()

    // Rerender component to verify circular progress has dissapeared
    rerender(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={() => {}}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={true}
      />
    )

    expect(screen.queryByTestId('loading-button-progress')).toBeNull()
  })

  it('handles redirection to join community page if user clicks on the link', async () => {
    const handleRedirection = jest.fn()
    const handleCommunityAction = jest.fn()

    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={handleRedirection}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const result = renderComponent(component)

    const switchLink = result.queryByText('join a community')
    expect(switchLink).not.toBeNull()
    // @ts-expect-error
    await userEvent.click(switchLink)

    expect(handleRedirection).toBeCalled()
    expect(handleCommunityAction).not.toBeCalled()
  })
})
