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
import { modalsActions, ModalsInitialState } from '../../../sagas/modals/modals.slice'
import JoinCommunity from './JoinCommunity'
import CreateCommunity from '../CreateCommunity/CreateCommunity'
import { JoinCommunityDictionary, CreateCommunityDictionary } from '../community.dictionary'
import CreateUsername from '../../CreateUsername/CreateUsername'
import PerformCommunityActionComponent from '../PerformCommunityActionComponent'
import { inviteLinkField } from '../../../forms/fields/communityFields'
import { InviteLinkErrors } from '../../../forms/fieldsErrors'
import { CommunityOwnership, type DeviceInvitationDataV4, InvitationKind } from '@quiet/types'
import { communities } from '@quiet/state-manager'
import {
  Site,
  QUIET_JOIN_PAGE,
  getValidInvitationUrlTestData,
  PSK_PARAM_KEY,
  validInvitationDatav4,
} from '@quiet/common'
import { createLogger } from '../../../logger'

const logger = createLogger('JoinCommunity.test')

describe('join community', () => {
  const { code } = getValidInvitationUrlTestData(validInvitationDatav4[0])
  const data = {
    ...validInvitationDatav4[0],
    kind: InvitationKind.Member,
  }

  const validCode = code()
  const deviceInvitationData: DeviceInvitationDataV4 = {
    ...validInvitationDatav4[0],
    kind: InvitationKind.Device,
    authData: {
      ...validInvitationDatav4[0].authData,
      userId: 'device-owner-id',
      userName: 'device-owner',
    },
  }
  const deviceInvitationCode = getValidInvitationUrlTestData(deviceInvitationData).code()

  it('users switches from join to create', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true,
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true },
        [ModalName.loadingPanel]: { open: false },
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
    const joinCommunityDictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(joinCommunityDictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Click redirecting link
    const link = screen.getByTestId('JoinCommunityLink')
    await userEvent.click(link)

    // Confirm user is being redirected to create community
    const createCommunityDictionary = CreateCommunityDictionary()
    const createCommunityTitle = await screen.findByText(createCommunityDictionary.header)
    expect(createCommunityTitle).toBeVisible()
  })

  it('user goes from joning community to username registration, then comes back', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true,
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true },
      },
    })

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
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
    await userEvent.type(joinCommunityInput, validCode)
    await userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Close username registration modal by clicking explicit close button
    const closeButton = await screen.findByTestId('createUsernameModalClose')
    await userEvent.click(closeButton)
    // Re-query after closing modal as the DOM node is re-created
    const joinCommunityTitleAgain = await screen.findByText(dictionary.header)
    expect(joinCommunityTitleAgain).toBeVisible()
  })

  it('links a device without opening username registration', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true,
      },
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.joinCommunityModal]: { open: true },
      },
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
      </>,
      store
    )

    const dictionary = JoinCommunityDictionary()
    await userEvent.type(screen.getByPlaceholderText(dictionary.placeholder), deviceInvitationCode)
    await userEvent.click(screen.getByText(dictionary.button))

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        communities.actions.linkDevice({
          inviteData: deviceInvitationData,
        })
      )
    })
    expect(dispatchSpy).toHaveBeenCalledWith(
      modalsActions.openModal({
        name: ModalName.loadingPanel,
        args: undefined,
      })
    )
    expect(screen.queryByText('Register a username')).not.toBeInTheDocument()
  })

  it('joins community on submit if connection is ready and registrar url is correct', async () => {
    const { store } = await prepareStore()
    const handleCommunityAction = jest.fn()

    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const result = renderComponent(component, store)

    const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder!)
    expect(textInput).not.toBeNull()

    await userEvent.type(textInput!, validCode)

    const submitButton = result.getByText('Continue')
    expect(submitButton).toBeEnabled()
    await userEvent.click(submitButton)

    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(data))
  })

  it.each([[`${QUIET_JOIN_PAGE}#${validCode}`], [`${QUIET_JOIN_PAGE}/#${validCode}`]])(
    'joins community on submit if connection is ready and invitation code is a correct invitation url (%s)',
    async (invitationLink: string) => {
      const { store } = await prepareStore()
      const registrarUrl = new URL(invitationLink)

      const handleCommunityAction = jest.fn()

      const component = (
        <PerformCommunityActionComponent
          open={true}
          handleClose={() => {}}
          communityOwnership={CommunityOwnership.User}
          handleCommunityAction={handleCommunityAction}
          handleRedirection={() => {}}
          isConnectionReady={true}
          isCloseDisabled={true}
          hasReceivedResponse={false}
        />
      )

      const result = renderComponent(component, store)

      const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder!)
      expect(textInput).not.toBeNull()
      // @ts-expect-error
      await userEvent.type(textInput, registrarUrl.href)

      const submitButton = result.getByText('Continue')
      expect(submitButton).toBeEnabled()
      await userEvent.click(submitButton)

      await waitFor(() => expect(handleCommunityAction).toBeCalledWith(data))
    }
  )

  it('trims whitespaces from registrar url', async () => {
    const { store } = await prepareStore()
    const registrarUrl = validCode + '     '

    const handleCommunityAction = jest.fn()

    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const result = renderComponent(component, store)

    const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder!)
    expect(textInput).not.toBeNull()
    // @ts-expect-error
    await userEvent.type(textInput, registrarUrl)

    const submitButton = result.getByText('Continue')
    expect(submitButton).toBeEnabled()
    await userEvent.click(submitButton)

    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(data))
  })

  it.each([
    [`http://${validCode}`, InviteLinkErrors.InvalidCode],
    [
      `12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx=bbb&${PSK_PARAM_KEY}=${data.psk}`,
      InviteLinkErrors.InvalidCode,
    ],
    ['bbb=y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd', InviteLinkErrors.InvalidCode],
    ['12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx= ', InviteLinkErrors.InvalidCode],
    ['nqnw4kc4c77fb47lk52m5l57h4tc', InviteLinkErrors.InvalidCode],
    [`https://otherwebsite.com/${Site.JOIN_PAGE}#${validCode}`, InviteLinkErrors.InvalidCode],
    [`${QUIET_JOIN_PAGE}?param=nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad`, InviteLinkErrors.InvalidCode],
    [`${Site.MAIN_PAGE}/share?${validCode}`, InviteLinkErrors.InvalidCode],
  ])('user inserting invalid url %s should see "%s" error', async (url: string, error: string) => {
    const { store } = await prepareStore()
    const handleCommunityAction = jest.fn()

    renderComponent(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />,
      store
    )

    const input = screen.getByPlaceholderText('Invite link')
    const button = screen.getByText('Continue')

    await userEvent.type(input, url)
    await userEvent.click(button)

    await waitFor(() => expect(handleCommunityAction).not.toBeCalled())

    const message = await screen.findByText(error)
    expect(message).toBeVisible()
  })

  it('blocks submit button if connection is not ready', async () => {
    const { store } = await prepareStore()
    const handleCommunityAction = jest.fn()

    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={() => {}}
        isConnectionReady={false}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const result = renderComponent(component, store)

    const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder!)
    expect(textInput).not.toBeNull()
    // @ts-expect-error
    await userEvent.type(textInput, validCode)

    const submitButton = result.getByTestId('continue-joinCommunity')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()

    expect(handleCommunityAction).not.toBeCalled()
  })

  // no longer relevant since we switched to non-blocking joinCommunity action
  it.skip('shows loading spinner on submit button while waiting for the response', async () => {
    const { rerender } = renderComponent(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={() => {}}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const textInput = screen.getByPlaceholderText(inviteLinkField().fieldProps.placeholder!)
    await userEvent.type(textInput, validCode)

    const submitButton = screen.getByText('Continue')
    expect(submitButton).toBeEnabled()
    await userEvent.click(submitButton)

    await act(async () => {})

    expect(screen.queryByTestId('loading-button-progress')).toBeVisible()

    // Rerender component to verify circular progress has dissapeared
    rerender(
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={() => {}}
        handleRedirection={() => {}}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={true}
      />
    )

    expect(screen.queryByTestId('loading-button-progress')).toBeNull()
  })

  it('handles redirection to create community page if user clicks on the link', async () => {
    const { store } = await prepareStore()
    const handleRedirection = jest.fn()

    const component = (
      <PerformCommunityActionComponent
        open={true}
        handleClose={() => {}}
        communityOwnership={CommunityOwnership.User}
        handleCommunityAction={() => {}}
        handleRedirection={handleRedirection}
        isConnectionReady={true}
        isCloseDisabled={true}
        hasReceivedResponse={false}
      />
    )

    const result = renderComponent(component, store)

    const switchLink = result.queryByText('create a new community')
    expect(switchLink).not.toBeNull()
    // @ts-expect-error
    await userEvent.click(switchLink)

    expect(handleRedirection).toBeCalled()
  })
})
