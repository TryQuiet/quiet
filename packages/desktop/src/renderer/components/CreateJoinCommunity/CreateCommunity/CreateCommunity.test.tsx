import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { SocketState } from '../../../sagas/socket/socket.slice'
import { ModalName } from '../../../sagas/modals/modals.types'
import { modalsActions, ModalsInitialState } from '../../../sagas/modals/modals.slice'
import CreateUsername from '../../CreateUsername/CreateUsername'
import GetStarted from '../../Onboarding/GetStarted'
import CreateCommunity from './CreateCommunity'
import { CommunityNameErrors } from '../../../forms/fieldsErrors'
import { CreateCommunityComponent } from '../../Onboarding/CreateCommunityComponent'
import { identity, communities, StoreKeys as StateManagerStoreKeys } from '@quiet/state-manager'
import { CHOOSE_USERNAME_HEADING, CREATE_COMMUNITY_HEADING, GET_STARTED_HEADING } from '@quiet/common'

const createModalOpen = {
  [StoreKeys.Socket]: {
    ...new SocketState(),
    isConnected: true,
  },
  [StoreKeys.Modals]: {
    ...new ModalsInitialState(),
    [ModalName.createCommunityModal]: { open: true },
    [ModalName.loadingPanel]: { open: false },
  },
}

describe('Create community', () => {
  it('closes the form once the progress screen opens for the submitted community', async () => {
    const { store } = await prepareStore(createModalOpen)

    renderComponent(
      <>
        <CreateCommunity />
        <CreateUsername />
      </>,
      store
    )

    await userEvent.type(screen.getByPlaceholderText('Community name'), 'rockets')
    await userEvent.click(screen.getByTestId('continue-createCommunity'))
    expect(await screen.findByText(CHOOSE_USERNAME_HEADING)).toBeVisible()
    // The form is still mounted underneath (aria-hidden behind Choose username) while the username and the terms are asked
    expect(screen.getByRole('heading', { name: CREATE_COMMUNITY_HEADING, level: 3, hidden: true })).toBeInTheDocument()

    // Creation proceeds: the loading panel opens (terms accepted / username registered)
    store.dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: CREATE_COMMUNITY_HEADING, level: 3, hidden: true })
      ).not.toBeInTheDocument()
    )
  })

  it('keeps the form while the loading panel is open for something else', async () => {
    const { store } = await prepareStore(createModalOpen)

    renderComponent(<CreateCommunity />, store)

    // Nothing submitted yet: a loading panel (e.g. the app starting) must not take the form away
    store.dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    expect(screen.getByRole('heading', { name: CREATE_COMMUNITY_HEADING, level: 3 })).toBeInTheDocument()
  })

  it('goes back to Get started from the create screen', async () => {
    const { store } = await prepareStore(createModalOpen)

    renderComponent(
      <>
        <GetStarted />
        <CreateCommunity />
      </>,
      store
    )

    expect(screen.getByRole('heading', { name: CREATE_COMMUNITY_HEADING, level: 3 })).toBeVisible()
    // Full-screen h1 stage (2811:2451): the heading is the only "Create a community"; the bar has no title, no hairline
    expect(screen.getAllByText(CREATE_COMMUNITY_HEADING)).toHaveLength(1)
    const header = screen.getByTestId('createCommunityModalActions').closest('.Modalheader')
    expect(header).not.toHaveClass('Modalnone')
    expect(header).not.toHaveClass('ModalheaderBorder')

    await userEvent.click(screen.getByTestId('createCommunityModalBack'))

    expect(await screen.findByRole('heading', { name: GET_STARTED_HEADING, level: 3 })).toBeVisible()
  })

  it.skip('user goes from creating community to username registration, then comes back', async () => {
    const { store } = await prepareStore({
      ...createModalOpen,
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

    const createCommunityTitle = screen.getByRole('heading', { name: CREATE_COMMUNITY_HEADING, level: 3 })
    expect(createCommunityTitle).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Community name'), 'rockets')
    await userEvent.click(screen.getByText('Continue'))

    const createUsernameTitle = await screen.findByText(CHOOSE_USERNAME_HEADING)
    expect(createUsernameTitle).toBeVisible()

    const closeButton = await screen.findByTestId('createUsernameModalClose')
    await userEvent.click(closeButton)
    expect(createCommunityTitle).toBeVisible()
  })

  it('creates community on submit if connection is ready', async () => {
    const handleCommunityAction = jest.fn()
    const result = renderComponent(<CreateCommunityComponent handleCommunityAction={handleCommunityAction} />)
    const communityName = 'communityname'
    const textInput = result.queryByPlaceholderText('Community name')
    expect(textInput).not.toBeNull()
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    // Create a community (2811:2451): Continue is disabled until the name is valid.
    await waitFor(() => expect(submitButton).toBeDisabled())
    await userEvent.type(textInput!, communityName)
    await waitFor(() => expect(submitButton).toBeEnabled())
    await userEvent.click(submitButton!)
    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(communityName))
  })

  it.each([
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
    ['!@#$%^&*()', '----------'],
  ])('user inserting wrong community name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
    renderComponent(<CreateCommunityComponent handleCommunityAction={() => {}} />)

    const input = screen.getByPlaceholderText('Community name')

    await userEvent.type(input, name)
    expect(screen.getByTestId('createCommunityNameWarning')).toHaveTextContent(
      `Your community will be created as #${corrected}`
    )
  })

  it('user inserting invalid community name should see an error', async () => {
    const handleCommunityAction = jest.fn()
    const name = 'too-long-community-name'
    const error = CommunityNameErrors.NameTooLong

    renderComponent(<CreateCommunityComponent handleCommunityAction={handleCommunityAction} />)

    const input = screen.getByPlaceholderText('Community name')
    const button = screen.getByTestId('continue-createCommunity')

    await userEvent.type(input, name)
    await userEvent.tab()

    // Continue stays disabled for an invalid name; the error shows once the field is touched.
    await waitFor(() => expect(button).toBeDisabled())
    expect(handleCommunityAction).not.toBeCalled()

    const message = await screen.findByText(error)
    expect(message).toBeVisible()
  })

  it('blocks submit button if connection is not ready', async () => {
    const handleCommunityAction = jest.fn()

    const result = renderComponent(
      <CreateCommunityComponent handleCommunityAction={handleCommunityAction} isConnectionReady={false} />
    )

    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()
  })

  it('has visible community name text', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.createCommunityModal]: { open: true },
      },
    })

    renderComponent(<CreateCommunity />, store)

    const createCommunityInput = screen.getByPlaceholderText('Community name')

    expect(createCommunityInput).toHaveAttribute('type', 'text')
  })

  describe('ServerOfferComponent flow', () => {
    const OLD_ENV = process.env
    beforeEach(() => {
      jest.resetModules()
      process.env = { ...OLD_ENV, QSS_ALLOWED: 'true', QSS_ENDPOINT: 'ws://localhost:80/' }
    })
    afterEach(() => {
      process.env = OLD_ENV
    })

    it(`doesn't show ServerOfferComponent when QSS_ALLOWED is true and QSS_ENDPOINT is invalid and user submits community name`, async () => {
      const { store } = await prepareStore(createModalOpen)

      process.env.QSS_ENDPOINT = ''

      renderComponent(
        <>
          <CreateCommunity />
          <CreateUsername />
        </>,
        store
      )

      await userEvent.type(screen.getByPlaceholderText('Community name'), 'rockets')
      await userEvent.click(screen.getByText('Continue'))

      // Straight to username registration, no server offer
      expect(await screen.findByText(CHOOSE_USERNAME_HEADING)).toBeVisible()
      expect(() => screen.getByTestId('ServerOffer-UseQuietServer')).toThrow()
      expect(() => screen.getByTestId('ServerOffer-NotNow')).toThrow()
    })

    it('shows ServerOfferComponent when QSS_ALLOWED is true and QSS_ENDPOINT is valid and user submits community name', async () => {
      const { store } = await prepareStore(createModalOpen)

      renderComponent(<CreateCommunity />, store)
      const input = screen.getByPlaceholderText('Community name')
      const button = screen.getByText('Continue')
      await userEvent.type(input, 'rockets')
      await userEvent.click(button)

      // ServerOffer modal should appear
      expect(await screen.findByTestId('ServerOffer-UseQuietServer')).toBeVisible()
      expect(screen.getByTestId('ServerOffer-NotNow')).toBeVisible()
    })

    it('dispatches createCommunity with useServer=true when user clicks "Use Quiet’s server"', async () => {
      const { store } = await prepareStore(createModalOpen)
      jest.spyOn(store, 'dispatch')

      renderComponent(<CreateCommunity />, store)
      const input = screen.getByPlaceholderText('Community name')
      const button = screen.getByText('Continue')
      await userEvent.type(input, 'rockets')
      await userEvent.click(button)

      const useServerBtn = await screen.findByTestId('ServerOffer-UseQuietServer')
      await userEvent.click(useServerBtn)

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('createCommunity'),
          payload: expect.objectContaining({ name: 'rockets', useServer: true }),
        })
      )
    })

    it('dispatches createCommunity with useServer=false when user clicks "Not now"', async () => {
      const { store } = await prepareStore(createModalOpen)
      jest.spyOn(store, 'dispatch')

      renderComponent(<CreateCommunity />, store)
      const input = screen.getByPlaceholderText('Community name')
      const button = screen.getByText('Continue')
      await userEvent.type(input, 'rockets')
      await userEvent.click(button)

      const notNowBtn = await screen.findByTestId('ServerOffer-NotNow')
      await userEvent.click(notNowBtn)

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('createCommunity'),
          payload: expect.objectContaining({ name: 'rockets', useServer: false }),
        })
      )
    })

    it("returns to the form with the name still typed when the offer's glyph goes back", async () => {
      const { store } = await prepareStore(createModalOpen)
      jest.spyOn(store, 'dispatch')

      renderComponent(<CreateCommunity />, store)
      const input = screen.getByPlaceholderText('Community name')
      await userEvent.type(input, 'rockets')
      await userEvent.click(screen.getByText('Continue'))

      // The bar glyph is a way back (2922:10009), so nothing is created and nothing is decided.
      await userEvent.click(await screen.findByTestId('ServerOfferModalClose'))

      expect(store.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringContaining('createCommunity') })
      )
      expect(screen.queryByTestId('ServerOffer-UseQuietServer')).toBeNull()
      // The form was never unmounted, so the name the user typed is still there to edit.
      expect(screen.getByPlaceholderText('Community name')).toHaveValue('rockets')
    })
  })
})
