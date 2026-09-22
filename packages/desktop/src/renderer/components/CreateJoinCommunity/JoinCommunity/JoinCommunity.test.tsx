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
import GetStarted from '../../Onboarding/GetStarted'
import LinkDevices from '../../Onboarding/LinkDevices'
import CreateUsername from '../../CreateUsername/CreateUsername'
import { PasteLinkComponent } from '../../Onboarding/PasteLinkComponent'
import { qrImageData } from '../../../testUtils/qrImage'
import { cameraError, mockCamera } from '../../../testUtils/mockCamera'
import { InviteLinkErrors } from '../../../forms/fieldsErrors'
import { ErrorMessages, type DeviceInvitationDataV4, InvitationKind } from '@quiet/types'
import { communities, StoreKeys as StateManagerStoreKeys } from '@quiet/state-manager'
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
    kind: InvitationKind.Member as const,
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

  it('opens on the paste step and clears an existing join error once when the invitation changes', async () => {
    const { store } = await prepareStore({
      ...openModalState(ModalName.joinCommunityModal),
      [StateManagerStoreKeys.Communities]: {
        ...new communities.State(),
        joinCommunityError: { type: 'invalid' },
      },
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<JoinCommunity />, store)

    // A reported join error belongs on the invite field, so the flow opens there rather than on the
    // three-way choice.
    const input = await screen.findByPlaceholderText('Link')
    expect(await screen.findByText(ErrorMessages.INVALID_INVITE)).toBeVisible()

    await userEvent.type(input, 'abc')

    const clearErrorActions = dispatchSpy.mock.calls.filter(
      ([action]) => action.type === communities.actions.clearJoinCommunityError.type
    )
    expect(clearErrorActions).toHaveLength(1)
  })

  /**
   * A join that fails is reported where the link was typed. Every kind of failure — the
   * link the client could not parse, and the three the backend reports after admission —
   * shows under the invite field on the paste step, and the modal stays on that step: it
   * does not bounce to the three-way choice or out to Get started.
   */
  describe('reports a failure on the invite field', () => {
    type JoinCommunityError = Parameters<typeof communities.actions.setJoinCommunityError>[0]

    const errorKinds: [string, JoinCommunityError, string][] = [
      ['an invalid invitation', { type: 'invalid' }, ErrorMessages.INVALID_INVITE],
      [
        'an interrupted admission',
        { type: 'interrupted', invitationType: 'community' },
        ErrorMessages.ADMISSION_INTERRUPTED_RETRY,
      ],
      [
        'a community admission timeout',
        { type: 'timeout', invitationType: 'community' },
        ErrorMessages.COMMUNITY_ADMISSION_TIMEOUT,
      ],
      [
        'a device admission timeout',
        { type: 'timeout', invitationType: 'device' },
        ErrorMessages.DEVICE_ADMISSION_TIMEOUT,
      ],
    ]

    const storeReporting = async (joinCommunityError: JoinCommunityError) =>
      await prepareStore({
        ...openModalState(ModalName.joinCommunityModal),
        [StateManagerStoreKeys.Communities]: {
          ...new communities.State(),
          joinCommunityError,
        },
      })

    describe.each(errorKinds)('%s', (_kind, joinCommunityError, message) => {
      it('shows the message under the invite field, on the paste step', async () => {
        const { store } = await storeReporting(joinCommunityError)

        renderComponent(
          <>
            <GetStarted />
            <JoinCommunity />
          </>,
          store
        )

        const input = await screen.findByPlaceholderText('Link')
        const error = await screen.findByText(message)
        expect(error).toBeVisible()
        // Under the input, as the field's own helper line - not a panel somewhere else on the page.
        expect(input.closest('.MuiFormControl-root')?.nextElementSibling).toHaveTextContent(message)
      })

      it('stays on the paste step rather than bouncing to the three-way choice or Get started', async () => {
        const { store } = await storeReporting(joinCommunityError)

        renderComponent(
          <>
            <GetStarted />
            <JoinCommunity />
          </>,
          store
        )

        expect(await screen.findByText(message)).toBeVisible()
        expect(screen.getByRole('heading', { name: 'Paste a link to join', level: 3 })).toBeVisible()
        expect(screen.queryByRole('heading', { name: 'Join community' })).not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Let’s get started...' })).not.toBeInTheDocument()
      })

      it('drops the message as soon as the invitation is edited, keeping what was typed', async () => {
        const { store } = await storeReporting(joinCommunityError)

        renderComponent(<JoinCommunity />, store)

        const input = await screen.findByPlaceholderText('Link')
        expect(await screen.findByText(message)).toBeVisible()

        await userEvent.type(input, 'another-link')

        await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument())
        // The message goes, and what was typed in its place stays.
        expect(input).toHaveValue('another-link')
        // And the field is still the one on the paste step.
        expect(screen.getByRole('heading', { name: 'Paste a link to join', level: 3 })).toBeVisible()
      })
    })

    it('reopens the closed flow on the paste step when the backend reports the failure', async () => {
      // The live sequence: the flow was left for Choose username and the progress panel, and the
      // verdict lands while this modal is shut. It must come back to the field the link was typed
      // in, not to the three-way choice or to Get started.
      const { store } = await prepareStore({
        ...openModalState(ModalName.joinCommunityModal),
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.joinCommunityModal]: { open: false },
          [ModalName.loadingPanel]: { open: false },
        },
      })

      renderComponent(
        <>
          <GetStarted />
          <JoinCommunity />
        </>,
        store
      )

      expect(screen.queryByPlaceholderText('Link')).not.toBeInTheDocument()

      act(() => {
        store.dispatch(communities.actions.setJoinCommunityError({ type: 'invalid' }))
      })

      const input = await screen.findByPlaceholderText('Link')
      expect(await screen.findByText(ErrorMessages.INVALID_INVITE)).toBeVisible()
      expect(input.closest('.MuiFormControl-root')?.nextElementSibling).toHaveTextContent(ErrorMessages.INVALID_INVITE)
      expect(screen.getByRole('heading', { name: 'Paste a link to join', level: 3 })).toBeVisible()
      expect(screen.queryByRole('heading', { name: 'Join community' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Let’s get started...' })).not.toBeInTheDocument()
    })

    it('reports a link the client cannot parse on the same field, without leaving the step', async () => {
      const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      renderComponent(
        <>
          <GetStarted />
          <JoinCommunity />
        </>,
        store
      )

      const input = await openPasteStep()
      await userEvent.type(input, 'https://example.com/not-an-invitation')
      await userEvent.click(screen.getByTestId('continue-joinCommunity'))

      const error = await screen.findByText(InviteLinkErrors.InvalidCode)
      expect(input.closest('.MuiFormControl-root')?.nextElementSibling).toHaveTextContent(InviteLinkErrors.InvalidCode)
      expect(error).toBeVisible()
      expect(screen.getByRole('heading', { name: 'Paste a link to join', level: 3 })).toBeVisible()
      expect(screen.queryByRole('heading', { name: 'Join community' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Let’s get started...' })).not.toBeInTheDocument()
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: communities.actions.joinCommunity.type })
      )

      // Editing the link takes the message away again.
      await userEvent.type(input, 'x')
      await waitFor(() => expect(screen.queryByText(InviteLinkErrors.InvalidCode)).not.toBeInTheDocument())
    })
  })

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
    expect(screen.getByTestId('recover-account')).not.toHaveAttribute('aria-disabled', 'true')
    // Full-screen h1 stage (2811:2562): the bar keeps only the back glyph — no "Quiet" title, no hairline
    expect(screen.queryByText('Quiet')).not.toBeInTheDocument()
    const header = screen.getByTestId('joinCommunityModalActions').closest('.Modalheader')
    expect(header).not.toHaveClass('Modalnone')
    expect(header).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('joinCommunityModalBack')).toBeVisible()

    await userEvent.click(screen.getByTestId('join-with-invite-link'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()
    // Open invite link (2811:2455): the heading is the only "Join with invite link" on screen
    expect(screen.getAllByText('Join with invite link')).toHaveLength(1)

    await userEvent.click(screen.getByTestId('paste-a-link'))
    expect(await screen.findByRole('heading', { name: 'Paste a link to join', level: 3 })).toBeVisible()
    expect(screen.getByPlaceholderText('Link')).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Let’s get started...', level: 3 })).toBeVisible()
  })

  it('opens Account recovery; "Use invite link" continues to Join with invite link and back retraces', async () => {
    const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))

    renderComponent(<JoinCommunity />, store)

    await userEvent.click(screen.getByTestId('recover-account'))
    expect(await screen.findByRole('heading', { name: 'Recover account', level: 3 })).toBeVisible()
    // Account recovery (2811:2535) hides its bar title
    expect(screen.queryByText('Account recovery')).not.toBeInTheDocument()
    // The frame's targetless "More options" row is not built
    expect(screen.queryByTestId('recover-more-options')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('recover-use-invite-link'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Recover account', level: 3 })).toBeVisible()

    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()
  })

  it('"Use linked device" on Account recovery hands over to Link devices, whose back returns to Account recovery', async () => {
    const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))

    renderComponent(
      <>
        <GetStarted />
        <JoinCommunity />
        <LinkDevices />
      </>,
      store
    )

    await userEvent.click(screen.getByTestId('recover-account'))
    await userEvent.click(await screen.findByTestId('recover-use-linked-device'))

    expect(await screen.findByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Recover account' })).not.toBeInTheDocument()

    // Back from Link devices returns to the screen it was opened from, not to Get started
    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByRole('heading', { name: 'Recover account', level: 3 })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Link devices' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Let’s get started...' })).not.toBeInTheDocument()

    // And the trail continues back to the three-way choice
    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
    expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()
  })

  describe('Join with QR code', () => {
    let camera: ReturnType<typeof mockCamera> | undefined
    afterEach(() => {
      camera?.restore()
      camera = undefined
    })

    it('scans a member link and goes on to username registration', async () => {
      camera = mockCamera({ frame: qrImageData(`${QUIET_JOIN_PAGE}#${validCode}`) })
      const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      renderComponent(
        <>
          <JoinCommunity />
          <CreateUsername />
        </>,
        store
      )

      await userEvent.click(screen.getByTestId('join-with-qr-code'))
      expect(await screen.findByTestId('qr-scanner-viewfinder')).toBeVisible()
      expect(screen.queryByPlaceholderText('Link')).not.toBeInTheDocument()

      expect(await screen.findByText('Choose username', {}, { timeout: 5000 })).toBeVisible()
      expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.joinCommunity({ inviteData: data }))
      expect(camera.stop).toHaveBeenCalled()
    })

    it('scans a device link and links this device once the consent is given', async () => {
      camera = mockCamera({ frame: qrImageData(`${QUIET_JOIN_PAGE}#${deviceInvitationCode}`) })
      const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      renderComponent(
        <>
          <JoinCommunity />
          <CreateUsername />
        </>,
        store
      )

      const consentedLinkDevice = communities.actions.linkDevice({
        inviteData: deviceInvitationData,
        deviceLinkConsent: true,
        confirmedQssEndpoint: undefined,
      })

      await userEvent.click(screen.getByTestId('join-with-qr-code'))

      // A device link scanned here is gated exactly as a pasted one is: the camera decodes whatever
      // is in front of it, so the decode alone is not consent to hand this account to that device.
      expect(await screen.findByTestId('device-link-consent', {}, { timeout: 5000 })).toBeVisible()
      expect(dispatchSpy).not.toHaveBeenCalledWith(consentedLinkDevice)

      await userEvent.click(screen.getByTestId('confirm-device-link'))

      await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(consentedLinkDevice))
      expect(screen.queryByText('Choose username')).not.toBeInTheDocument()
    })

    it('falls back to the paste field when the camera is denied, and back returns to the scanner', async () => {
      camera = mockCamera({ error: cameraError('NotAllowedError') })
      const { store } = await prepareStore(openModalState(ModalName.joinCommunityModal))

      renderComponent(<JoinCommunity />, store)

      await userEvent.click(screen.getByTestId('join-with-qr-code'))
      await userEvent.click(await screen.findByTestId('qr-scanner-paste-link'))
      expect(await screen.findByRole('heading', { name: 'Paste a link to join', level: 3 })).toBeVisible()
      expect(screen.getByPlaceholderText('Link')).toBeVisible()

      await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
      expect(await screen.findByTestId('qr-scanner-viewfinder')).toBeVisible()

      await userEvent.click(screen.getByTestId('joinCommunityModalBack'))
      expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()
    })
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

    // Linking a device is never done without consent.
    expect(screen.getByTestId('device-link-consent')).toBeVisible()
    await userEvent.click(screen.getByTestId('confirm-device-link'))

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        communities.actions.linkDevice({
          inviteData: deviceInvitationData,
          deviceLinkConsent: true,
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
      <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />,
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
        <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />,
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
      <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />,
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
      <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />,
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
        heading={'Paste a link to join'}
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
