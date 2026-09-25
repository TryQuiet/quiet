import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { communities, connection } from '@quiet/state-manager'
import { type DeviceInvitationDataV4, type InvitationDataV4, InvitationKind } from '@quiet/types'
import {
  LINK_DEVICES_HEADING,
  PASTE_LINK_HEADING,
  PASTE_LINK_PLACEHOLDER,
  QUIET_JOIN_PAGE,
  SCAN_QR_CODE_HEADING,
  SCAN_QR_CODE_INTRO,
  getValidInvitationUrlTestData,
  validInvitationDatav4,
} from '@quiet/common'

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
import LinkDevices from './LinkDevices'

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

/**
 * What the app dispatches once the user has consented. `confirmedQssEndpoint` is only carried for a
 * v5 invitation; this fixture is v4, so it is undefined.
 */
const consentedLinkDevice = communities.actions.linkDevice({
  inviteData: deviceInvitationData,
  deviceLinkConsent: true,
  confirmedQssEndpoint: undefined,
})

let camera: ReturnType<typeof mockCamera> | undefined
afterEach(() => {
  camera?.restore()
  camera = undefined
})

describe('Link devices → Scan QR code', () => {
  it('opens the camera with the sheet copy and asks for consent before linking from the scanned code', async () => {
    camera = mockCamera({ frame: qrImageData(deviceLink) })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    expect(await screen.findByText(SCAN_QR_CODE_INTRO)).toBeVisible()
    expect(screen.getByTestId('link-devices-scanner-viewfinder')).toBeVisible()
    expect(screen.queryByPlaceholderText(PASTE_LINK_PLACEHOLDER)).not.toBeInTheDocument()

    // A camera decodes whatever is put in front of it, so the scan path is gated exactly as the
    // paste path is: nothing is linked until the user says so.
    expect(await screen.findByTestId('device-link-consent', {}, { timeout: 5000 })).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(consentedLinkDevice)
    expect(camera.stop).toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('confirm-device-link'))

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(consentedLinkDevice))
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.openModal({ name: ModalName.loadingPanel, args: undefined }))
  })

  it('links nothing when the consent for a scanned code is declined', async () => {
    camera = mockCamera({ frame: qrImageData(deviceLink) })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    expect(await screen.findByTestId('device-link-consent', {}, { timeout: 5000 })).toBeVisible()

    // Agree & join has no decline button (#3524): the card's back glyph is the way out.
    await userEvent.click(screen.getByTestId('deviceLinkConsentModalBack'))

    await waitFor(() => expect(screen.queryByTestId('device-link-consent')).not.toBeInTheDocument())
    expect(dispatchSpy).not.toHaveBeenCalledWith(consentedLinkDevice)
  })

  it('offers the paste field when there is no camera, and the pasted device link links after consent', async () => {
    camera = mockCamera({ error: cameraError('NotFoundError') })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(await screen.findByTestId('link-devices-scanner-paste-link'))
    expect(await screen.findByRole('heading', { name: PASTE_LINK_HEADING, level: 3 })).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText(PASTE_LINK_PLACEHOLDER), deviceLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    expect(await screen.findByTestId('device-link-consent')).toBeVisible()
    await userEvent.click(screen.getByTestId('confirm-device-link'))

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(consentedLinkDevice))
  })

  it('back from the paste field returns to the scanner, then to the entry screen', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })
    const { store } = await prepareStore(openState())

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(await screen.findByTestId('link-devices-scanner-paste-link'))
    expect(await screen.findByPlaceholderText(PASTE_LINK_PLACEHOLDER)).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByTestId('link-devices-scanner-viewfinder')).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByRole('heading', { name: LINK_DEVICES_HEADING, level: 3 })).toBeVisible()
  })
})

describe('Link devices → Paste link', () => {
  it('opens the paste step with no bar title (an h1 screen), and a device link links this device', async () => {
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-paste-link'))
    expect(await screen.findByRole('heading', { name: PASTE_LINK_HEADING, level: 3 })).toBeVisible()
    expect(screen.queryByText(LINK_DEVICES_HEADING)).not.toBeInTheDocument() // no bar title: the h1 is the title
    expect(screen.queryByTestId('link-devices-scanner-viewfinder')).not.toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText(PASTE_LINK_PLACEHOLDER), deviceLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    // Pasted or scanned, a device link is only acted on once its consent is given.
    expect(await screen.findByTestId('device-link-consent')).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(consentedLinkDevice)
    await userEvent.click(screen.getByTestId('confirm-device-link'))

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(consentedLinkDevice))
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
    await userEvent.type(await screen.findByPlaceholderText(PASTE_LINK_PLACEHOLDER), memberLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    expect(await screen.findByText(InviteLinkErrors.NotDeviceLink)).toBeVisible()
    expect(screen.getByPlaceholderText(PASTE_LINK_PLACEHOLDER)).toBeVisible() // still on the paste step
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      communities.actions.joinCommunity({ inviteData: memberInvitationData })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: communities.actions.linkDevice.type }))
    // A refused link raises no consent sheet, because nothing was going to be linked.
    expect(screen.queryByTestId('device-link-consent')).not.toBeInTheDocument()
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
    await userEvent.type(await screen.findByPlaceholderText(PASTE_LINK_PLACEHOLDER), 'https://example.com/')
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
    expect(await screen.findByPlaceholderText(PASTE_LINK_PLACEHOLDER)).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByRole('heading', { name: LINK_DEVICES_HEADING, level: 3 })).toBeVisible()
    expect(screen.getByTestId('link-devices-paste-link')).toBeVisible()
  })

  it("the scanner's paste fallback rejects a member link the same way", async () => {
    camera = mockCamera({ error: cameraError('NotFoundError') })
    const { store } = await prepareStore(openState())
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(await screen.findByTestId('link-devices-scanner-paste-link'))
    await userEvent.type(await screen.findByPlaceholderText(PASTE_LINK_PLACEHOLDER), memberLink)
    await userEvent.click(screen.getByTestId('continue-joinCommunity'))

    expect(await screen.findByText(InviteLinkErrors.NotDeviceLink)).toBeVisible()
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      communities.actions.joinCommunity({ inviteData: memberInvitationData })
    )
  })
})

describe('Link devices → Display QR code', () => {
  it('without a community this device receives: Scan QR code and Paste link, no share rows', async () => {
    const { store } = await prepareStore(openState())

    renderComponent(<LinkDevices />, store)

    expect(screen.getByTestId('link-devices-scan-qr')).toBeVisible()
    expect(screen.getByTestId('link-devices-paste-link')).toBeVisible()
    expect(screen.queryByTestId('link-devices-display-qr')).not.toBeInTheDocument()
    expect(screen.queryByTestId('link-devices-copy-link')).not.toBeInTheDocument()
    // Receiving, there is no community and so no team graph to list devices from
    // (TryQuiet/quiet#3636); the list belongs to the share direction.
    expect(screen.queryByTestId('linked-devices-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
  })

  it('inside a community it opens the QR code sheet, mints a link, and close returns to Link devices', async () => {
    const { store } = await prepareStore(openState())
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { name: 'devices' })
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkDevices />, store)

    await userEvent.click(screen.getByTestId('link-devices-display-qr'))
    expect(await screen.findByTestId('link-devices-display-box')).toBeVisible()
    // No bar title (#3690, user decision): the bar zone keeps only the close glyph.
    expect(screen.queryByText('QR code')).not.toBeInTheDocument()
    expect(screen.getByText(DISPLAY_QR_CODE_COPY.scan)).toBeVisible()
    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())
    expect(screen.queryByTestId('linkDevicesModalBack')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('linkDevicesModalClose'))
    expect(await screen.findByRole('heading', { name: LINK_DEVICES_HEADING, level: 3 })).toBeVisible()
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

    expect(await screen.findByTestId('link-devices-display-box')).toBeVisible()
    expect(screen.queryByText('QR code')).not.toBeInTheDocument()
    expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink())

    await userEvent.click(screen.getByTestId('linkDevicesModalClose'))
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.closeModal(ModalName.linkDevicesModal))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      modalsActions.openModal({ name: ModalName.getStartedModal, args: undefined })
    )
  })
})

const openLinkDevices = {
  [StoreKeys.Socket]: {
    ...new SocketState(),
    isConnected: true,
  },
  [StoreKeys.Modals]: {
    ...new ModalsInitialState(),
    [ModalName.linkDevicesModal]: { open: true },
  },
}

/**
 * The prototype draws these frames with titled bars (2811:2575, 2811:2587), but each one
 * repeats that title as its own large heading, and a page with a heading gets no bar
 * title. The bar zone stays for the back glyph. Two exceptions, both covered elsewhere in
 * this file: the scanner draws the camera rather than a heading and so keeps the bar
 * title, and Display QR code (2811:2601) is a sheet with a close glyph and no bar title
 * (#3690), reachable only inside a community.
 */
describe('Link devices — no bar title above a heading', () => {
  const header = () => screen.getByTestId('linkDevicesModalActions').closest('.Modalheader')

  it('shows the heading and only the back glyph on every step', async () => {
    const { store } = await prepareStore(openLinkDevices)
    renderComponent(<LinkDevices />, store)

    // entry (2811:2575)
    expect(screen.getByRole('heading', { name: LINK_DEVICES_HEADING, level: 3 })).toBeVisible()
    expect(screen.getAllByText(LINK_DEVICES_HEADING)).toHaveLength(1)
    expect(header()).not.toHaveClass('Modalnone')
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()

    // scan (2811:2587): the scanner draws the camera, not a heading, so this is the one
    // step that keeps the frame's bar title rather than hiding it.
    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    expect(await screen.findByTestId('link-devices-scanner-viewfinder')).toBeVisible()
    expect(screen.queryByRole('heading', { name: SCAN_QR_CODE_HEADING, level: 3 })).not.toBeInTheDocument()
    expect(screen.getAllByText(SCAN_QR_CODE_HEADING)).toHaveLength(1)
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()

    // back to entry, then the Paste link step: the bar would have said "Link devices"
    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    await userEvent.click(await screen.findByTestId('link-devices-paste-link'))
    expect(await screen.findByRole('heading', { name: PASTE_LINK_HEADING, level: 3 })).toBeVisible()
    expect(screen.queryByText(LINK_DEVICES_HEADING)).not.toBeInTheDocument()
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()
  })
})
