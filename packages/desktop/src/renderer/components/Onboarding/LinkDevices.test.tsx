import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { communities } from '@quiet/state-manager'
import { type DeviceInvitationDataV4, InvitationKind } from '@quiet/types'
import { QUIET_JOIN_PAGE, getValidInvitationUrlTestData, validInvitationDatav4 } from '@quiet/common'

import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { qrImageData } from '../../testUtils/qrImage'
import { cameraError, mockCamera } from '../../testUtils/mockCamera'
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
    expect(screen.queryByPlaceholderText('Link')).not.toBeInTheDocument()

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
    expect(await screen.findByRole('heading', { name: 'Paste a link to Join', level: 3 })).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Link'), deviceLink)
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
    expect(await screen.findByPlaceholderText('Link')).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByTestId('link-devices-scanner-viewfinder')).toBeVisible()

    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    expect(await screen.findByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
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
 * The prototype draws these three frames with titled bars (2811:2575, 2811:2601,
 * 2811:2587), but each one repeats that title as its own large heading, and a
 * page with a heading gets no bar title. The bar zone stays for the back glyph.
 */
describe('Link devices — no bar title above a heading', () => {
  const header = () => screen.getByTestId('linkDevicesModalActions').closest('.Modalheader')

  it('shows the heading and only the back glyph on every step', async () => {
    const { store } = await prepareStore(openLinkDevices)
    renderComponent(<LinkDevices />, store)

    // entry (2811:2575)
    expect(screen.getByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
    expect(screen.getAllByText('Link devices')).toHaveLength(1)
    expect(header()).not.toHaveClass('Modalnone')
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()

    // scan (2811:2587): the scanner draws the camera, not a heading, so this is the one
    // step that keeps the frame's bar title rather than hiding it.
    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    expect(await screen.findByTestId('link-devices-scanner-viewfinder')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Scan QR code', level: 3 })).not.toBeInTheDocument()
    expect(screen.getAllByText('Scan QR code')).toHaveLength(1)
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()

    // back to entry, then display (2811:2601): the bar would have said "QR code"
    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    await userEvent.click(await screen.findByTestId('link-devices-display-qr'))
    expect(await screen.findByTestId('link-devices-display')).toBeVisible()
    expect(screen.queryByText('QR code')).not.toBeInTheDocument()
    expect(header()).not.toHaveClass('ModalheaderBorder')
  })
})
