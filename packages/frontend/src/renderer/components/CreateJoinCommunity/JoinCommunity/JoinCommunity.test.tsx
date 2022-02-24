import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { socketActions, SocketState } from '../../../sagas/socket/socket.slice'
import { ModalName } from '../../../sagas/modals/modals.types'
import { modalsActions, ModalsInitialState } from '../../../sagas/modals/modals.slice'
import JoinCommunity from './JoinCommunity'
import CreateCommunity from '../CreateCommunity/CreateCommunity'
import { JoinCommunityDictionary, CreateCommunityDictionary } from '../community.dictionary'
import CreateUsername from '../../CreateUsername/CreateUsername'
import LoadingPanelModal from '../../../containers/widgets/loadingPanel/loadingPanel'
import { LoadingMessages } from '../../../containers/widgets/loadingPanel/loadingMessages'
import { communities, getFactory, StoreKeys as NectarStoreKeys, Identity, Community, identity, identityAdapter, communitiesAdapter } from '@quiet/nectar'
import PerformCommunityActionComponent from '../PerformCommunityActionComponent'
import { CommunityAction } from '../community.keys'
import { inviteLinkField } from '../../../forms/fields/communityFields'
import { InviteLinkErrors } from '../../../forms/fieldsErrors'

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

  it('joins community on submit if connection is ready and registrar url is correct', async () => {
    const registrarUrl = 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad'

    const handleCommunityAction = jest.fn()

    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={CommunityAction.Join}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />

    const result = renderComponent(component)

    const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder)
    expect(textInput).not.toBeNull()

    userEvent.type(textInput, registrarUrl)

    const submitButton = result.queryByRole('button')
    expect(submitButton).toBeEnabled()
    userEvent.click(submitButton)

    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(registrarUrl))
  })

  it.skip('trims whitespaces from registrar url', async () => {
    const registrarUrl = 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad    '

    const handleCommunityAction = jest.fn()

    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={CommunityAction.Join}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />

    const result = renderComponent(component)

    const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder)
    expect(textInput).not.toBeNull()

    userEvent.type(textInput, registrarUrl)

    const submitButton = result.queryByRole('button')
    expect(submitButton).toBeEnabled()
    userEvent.click(submitButton)

    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(registrarUrl))
  })

  it.each([
    ['http://nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion', InviteLinkErrors.WrongCharacter],
    ['nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad000', InviteLinkErrors.WrongCharacter],
    ['nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2ola!', InviteLinkErrors.WrongCharacter],
    ['nqnw4kc4c77fb47lk52m5l57h4tc', InviteLinkErrors.WrongCharacter]
  ])('user inserting invalid url %s should see "%s" error', async (url: string, error: string) => {
    const handleCommunityAction = jest.fn()

    renderComponent(<PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={CommunityAction.Join}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />)

    const input = screen.getByPlaceholderText('Invite code')
    const button = screen.getByText('Continue')

    userEvent.type(input, url)
    userEvent.click(button)

    await waitFor(() => expect(handleCommunityAction).not.toBeCalled())

    const message = await screen.findByText(error)
    expect(message).toBeVisible()
  })

  it('blocks submit button if connection is not ready', async () => {
    const handleCommunityAction = jest.fn()

    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={CommunityAction.Join}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={false}
      community={false}
    />

    const result = renderComponent(component)

    const textInput = result.queryByPlaceholderText(inviteLinkField().fieldProps.placeholder)
    expect(textInput).not.toBeNull()

    userEvent.type(textInput, 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad')

    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()

    expect(handleCommunityAction).not.toBeCalled()
  })

  it('handles redirection if user clicks on the link', async () => {
    const handleRedirection = jest.fn()

    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={CommunityAction.Join}
      handleCommunityAction={() => { }}
      handleRedirection={handleRedirection}
      isConnectionReady={true}
      community={false}
    />

    const result = renderComponent(component)

    const switchLink = result.queryByText('create a new community')
    expect(switchLink).not.toBeNull()

    userEvent.click(switchLink)

    expect(handleRedirection).toBeCalled()
  })

  // TODO: move this scenario to rtl-tests and provide socket (nectar sagas) to prepareStore method
  it.skip('user rejoins to remembered community without user data', async () => {
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
        <CreateUsername />
      </>,
      store
    )

    const createUsernameTitle = screen.getByText('Register a username')
    expect(createUsernameTitle).toBeVisible()
  })

  // TODO: move this scenario to rtl-tests and provide socket (nectar sagas) to prepareStore method
  it.skip('user rejoins to remembered community with user certificate', async () => {
    const { store } = await prepareStore()

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    store.dispatch(modalsActions.openModal({
      name: ModalName.joinCommunityModal
    }))

    store.dispatch(identity.actions.storeUserCertificate({
      userCertificate: '',
      communityId: community.id
    }))

    const result1 = renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
        <LoadingPanelModal />
      </>,
      store
    )

    const switchLink1 = result1.queryByText(LoadingMessages.CreateCommunity)
    expect(switchLink1).toBeInTheDocument()

    store.dispatch(identity.actions.storeUserCertificate({
      userCertificate: 'userCert',
      communityId: community.id
    }))

    /* Calling renderComponent doesn't simulate 'closing' the app - it just renders jsdom
       the only way to achieve desired scenario is to mock the initial state of redux store */
    const result2 = renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
        <LoadingPanelModal />
      </>,
      store
    )

    const switchLink2 = result2.queryByText(LoadingMessages.CreateCommunity)
    expect(switchLink2).toBeNull()
  })

  it('remove unregistered community from store after invalid registration with username taken error', async () => {
    const communityAlpha: Community = {
      name: 'alpha',
      id: 'communityAlpha',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: '',
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0
    }

    const identityAlpha: Identity = {
      id: 'communityAlpha',
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
      [NectarStoreKeys.Communities]: {
        ...new communities.State(),
        currentCommunity: 'communityAlpha',
        communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
          communityAlpha
        ])
      },
      [NectarStoreKeys.Identity]: {
        ...new identity.State(),
        identities: identityAdapter.setAll(identityAdapter.getInitialState(), [
          identityAlpha
        ])
      }
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
    userEvent.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd')
    userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter user name and hit button
    const createUsernameInput = screen.getByPlaceholderText('Enter a username')
    const createUsernameButton = screen.getByText('Register')
    userEvent.type(createUsernameInput, 'alice')
    userEvent.click(createUsernameButton)

    // Wait for action what removes community from store after click on register button and check is it removed
    await waitFor(() => expect(store.getState().Communities.communities.ids.length).toBe(0))
  })
})
