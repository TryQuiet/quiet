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
import JoinCommunity from './JoinCommunity'
import GetStarted from '../../Onboarding/GetStarted'
import CreateUsername from '../../CreateUsername/CreateUsername'
import { PasteLinkComponent } from '../../Onboarding/PasteLinkComponent'
import { InviteLinkErrors } from '../../../forms/fieldsErrors'
import { type DeviceInvitationDataV4, InvitationKind } from '@quiet/types'
import { communities } from '@quiet/state-manager'
import {
  Site,
  QUIET_JOIN_PAGE,
  getValidInvitationUrlTestData,
  PSK_PARAM_KEY,
  validInvitationDatav4,
} from '@quiet/common'

const openModalState = (name: ModalName) => ({
  [StoreKeys.Socket]: {
    ...new SocketState(),
    isConnected: true,
  },
  [StoreKeys.Modals]: {
    ...new ModalsInitialState(),
    [name]: { open: true },
    [ModalName.loadingPanel]: { open: false },
  },
})

/** Three-way choice → Open invite link → Paste a link. */
const openPasteStep = async () => {
  await userEvent.click(screen.getByTestId('join-with-invite-link'))
  await userEvent.click(await screen.findByTestId('paste-a-link'))
  return await screen.findByPlaceholderText('Link')
}

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

  it('walks from the three-way choice to the paste step and back to Get started', async () => {
    const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))

    renderComponent(
      <>
        <GetStarted />
        <JoinCommunity />
      </>,
      store
    )

    expect(screen.getByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()
    expect(screen.getByTestId('recover-account')).toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(screen.getByTestId('join-with-invite-link'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('paste-a-link'))
    expect(await screen.findByRole('heading', { name: 'Paste a link to Join', level: 3 })).toBeVisible()
    expect(screen.getByPlaceholderText('Link')).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Let’s get started...', level: 3 })).toBeVisible()
  })

  it('takes the pasted link for "Join with QR code" since desktop has no camera', async () => {
    const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))

    renderComponent(<JoinCommunity />, store)

    await userEvent.click(screen.getByTestId('join-with-qr-code'))
    expect(await screen.findByRole('heading', { name: 'Join with QR code', level: 3 })).toBeVisible()
    expect(screen.getByPlaceholderText('Link')).toBeVisible()
  })

  it('user goes from joining community to username registration, then comes back', async () => {
    const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
      </>,
      store
    )

    const joinCommunityInput = await openPasteStep()
    await userEvent.type(joinCommunityInput, validCode)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Choose username')
    expect(createUsernameTitle).toBeVisible()

    // Close username registration modal by clicking explicit close button
    const closeButton = await screen.findByTestId('createUsernameModalClose')
    await userEvent.click(closeButton)
    // The join modal reopens on its first step
    expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()
  })

  it('links a device without opening username registration', async () => {
    const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsername />
      </>,
      store
    )

    await userEvent.type(await openPasteStep(), deviceInvitationCode)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

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
    expect(screen.queryByText('Choose username')).not.toBeInTheDocument()
  })

  it('joins community on submit if connection is ready and registrar url is correct', async () => {
    const { store } = await prepareStore()
    const handleCommunityAction = jest.fn()

    const result = renderComponent(
      <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={handleCommunityAction} />,
      store
    )

    const textInput = result.queryByPlaceholderText('Link')
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

      const result = renderComponent(
        <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={handleCommunityAction} />,
        store
      )

      const textInput = result.queryByPlaceholderText('Link')
      expect(textInput).not.toBeNull()
      await userEvent.type(textInput!, registrarUrl.href)

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

    const result = renderComponent(
      <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={handleCommunityAction} />,
      store
    )

    const textInput = result.queryByPlaceholderText('Link')
    expect(textInput).not.toBeNull()
    await userEvent.type(textInput!, registrarUrl)

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
      <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={handleCommunityAction} />,
      store
    )

    const input = screen.getByPlaceholderText('Link')
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

    const result = renderComponent(
      <PasteLinkComponent
        heading={'Paste a link to Join'}
        handleCommunityAction={handleCommunityAction}
        isConnectionReady={false}
      />,
      store
    )

    const textInput = result.queryByPlaceholderText('Link')
    expect(textInput).not.toBeNull()
    await userEvent.type(textInput!, validCode)

    const submitButton = result.getByTestId('continue-joinCommunity')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()

    expect(handleCommunityAction).not.toBeCalled()
  })
})
