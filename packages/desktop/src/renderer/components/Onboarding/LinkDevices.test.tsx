import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { communities, connection } from '@quiet/state-manager'
import { type DeviceInvitationDataV4, type InvitationDataV4, InvitationKind } from '@quiet/types'
import { QUIET_JOIN_PAGE, getValidInvitationUrlTestData, validInvitationDatav4 } from '@quiet/common'

import { InviteLinkErrors } from '../../forms/fieldsErrors'

import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { qrImageData } from '../../testUtils/qrImage'
import { cameraError, mockCamera } from '../../testUtils/mockCamera'
import { getReduxStoreFactory } from '@quiet/state-manager'
import { DISPLAY_QR_CODE_COPY } from './DisplayQrCodeComponent'
import { StoreKeys } from '../../store/store.keys'
import { SocketState } from '../../sagas/socket/socket.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import { modalsActions, ModalsInitialState } from '../../sagas/modals/modals.slice'
import LinkDevices, { SCAN_QR_CODE_INTRO } from './LinkDevices'

const openState = () => ({
  [StoreKeys.Socket]: { ...new SocketState(), isConnected: true },
  [StoreKeys.Modals]: {
    ...new ModalsInitialState(),
    [ModalName.linkDevicesModal]: { open: true },
    [ModalName.loadingPanel]: { open: false },
  },
})

const deviceInvitationData: DeviceInvitationDataV4 = {
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device,
  authData: { ...validInvitationDatav4[0].authData, userId: 'device-owner-id', userName: 'device-owner' },
}
const deviceLink = `${QUIET_JOIN_PAGE}#${getValidInvitationUrlTestData(deviceInvitationData).code()}`
const memberLink = getValidInvitationUrlTestData(validInvitationDatav4[0]).shareUrl()
const memberInvitationData: InvitationDataV4 = { ...validInvitationDatav4[0], kind: InvitationKind.Member }

let camera: ReturnType<typeof mockCamera> | undefined
afterEach(() => {
  camera?.restore()
  camera = undefined
})

describe('Link devices → Scan QR code', () => {
  it('opens the camera with the sheet copy and links this device from the scanned code', async () => {
    camera = mockCamera({ frame: qrImageData(deviceLink) })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    expect(await screen.findByText(SCAN_QR_CODE_INTRO)).toBeVisible()
    expect(screen.getByTestId('link-devices-scanner-viewfinder')).toBeVisible()
    expect(screen.queryByPlaceholderText('Link')).not.toBeInTheDocument()

    await waitFor(
      () =>
        expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvitationData })),
      { timeout: 5000 }
    )
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.openModal({ name: ModalName.loadingPanel, args: undefined }))
    expect(camera.stop).toHaveBeenCalled()
  })

  it('offers the paste field when there is no camera, and the pasted device link links the device', async () => {
    camera = mockCamera({ error: cameraError('NotFoundError') })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(await screen.findByTestId('link-devices-scanner-paste-link'))
    expect(await screen.findByRole('heading', { name: 'Paste a link to Join', level: 3 })).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Link'), deviceLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvitationData }))
    )
  })

  it('back from the paste field returns to the scanner, then to the entry screen', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })
    const { store } = await prepareStore(openState())

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(await screen.findByTestId('link-devices-scanner-paste-link'))
    expect(await screen.findByPlaceholderText('Link')).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByTestId('link-devices-scanner-viewfinder')).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
  })
})

describe('Link devices → Paste link', () => {
  it('opens the paste step with no bar title (an h1 screen), and a device link links this device', async () => {
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-paste-link'))
    expect(await screen.findByRole('heading', { name: 'Paste a link to Join', level: 3 })).toBeVisible()
    expect(screen.queryByText('Link devices')).not.toBeInTheDocument() // no bar title: the h1 is the title
    expect(screen.queryByTestId('link-devices-scanner-viewfinder')).not.toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Link'), deviceLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvitationData }))
    )
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.openModal({ name: ModalName.loadingPanel, args: undefined }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      communities.actions.joinCommunity({ inviteData: memberInvitationData })
    )
  })

  it('a member link shows the not-a-device-link error under the input and dispatches nothing', async () => {
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-paste-link'))
    await userEvent.type(await screen.findByPlaceholderText('Link'), memberLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    expect(await screen.findByText(InviteLinkErrors.NotDeviceLink)).toBeVisible()
    expect(screen.getByPlaceholderText('Link')).toBeVisible() // still on the paste step
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      communities.actions.joinCommunity({ inviteData: memberInvitationData })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: communities.actions.linkDevice.type }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      modalsActions.openModal({ name: ModalName.loadingPanel, args: undefined })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(modalsActions.closeModal(ModalName.linkDevicesModal))
  })

  it('text that is not an invitation shows the invalid-code error', async () => {
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-paste-link'))
    await userEvent.type(await screen.findByPlaceholderText('Link'), 'https://example.com/')
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    expect(await screen.findByText(InviteLinkErrors.InvalidCode)).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: communities.actions.linkDevice.type }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: communities.actions.joinCommunity.type })
    )
  })

  it('back from the Paste link step returns to the entry screen', async () => {
    const { store } = await prepareStore(openState())

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-paste-link'))
    expect(await screen.findByPlaceholderText('Link')).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
    expect(screen.getByTestId('link-devices-paste-link')).toBeVisible()
  })

  it("the scanner's paste fallback rejects a member link the same way", async () => {
    camera = mockCamera({ error: cameraError('NotFoundError') })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(await screen.findByTestId('link-devices-scanner-paste-link'))
    await userEvent.type(await screen.findByPlaceholderText('Link'), memberLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    expect(await screen.findByText(InviteLinkErrors.NotDeviceLink)).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      communities.actions.joinCommunity({ inviteData: memberInvitationData })
    )
  })
})

describe('Link devices → Display QR code', () => {
  it('is disabled without a community', async () => {
    const { store } = await prepareStore(openState())

    renderComponent(<LinkDevices />, store)

    expect(screen.getByTestId('link-devices-display-qr')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('link-devices-rows')).toBeVisible()
    expect(screen.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })

  it('inside a community it opens the QR code sheet, mints a link, and close returns to Link devices', async () => {
    const { store } = await prepareStore(openState())
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-display-qr'))
    expect(await screen.findByText('QR code')).toBeVisible() // the title bar
    expect(screen.getByTestId('link-devices-display-box')).toBeVisible()
    expect(screen.getByText(DISPLAY_QR_CODE_COPY.scan)).toBeVisible()
    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(screen.queryByTestId('linkDevicesModalBack')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('linkDevicesModalClose'))
    expect(await screen.findByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(modalsActions.closeModal(ModalName.linkDevicesModal))
  })

  it('opened straight at the QR sheet (from Settings), close leaves the modal instead of showing the rows', async () => {
    const { store } = await prepareStore({
      ...openState(),
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.linkDevicesModal]: { open: true, args: { step: 'display' } },
        [ModalName.loadingPanel]: { open: false },
      },
    })
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    expect(await screen.findByText('QR code')).toBeVisible()
    expect(screen.getByTestId('link-devices-display-box')).toBeVisible()
    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())

    await userEvent.click(screen.getByTestId('linkDevicesModalClose'))
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.closeModal(ModalName.linkDevicesModal))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      modalsActions.openModal({ name: ModalName.getStartedModal, args: undefined })
    )
  })
})
