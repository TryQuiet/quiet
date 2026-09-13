import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import type { ReactTestInstance } from 'react-test-renderer'

import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { type DeviceInvitationDataV4, InvitationKind, type InvitationDataV4 } from '@quiet/types'

import { ScreenNames } from '../../const/ScreenNames.enum'
import type { ScanQrCodeVariant } from '../../route.params'
import { initActions } from '../../store/init/init.slice'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { resetVisionCameraMock, visionCameraMock } from '../../tests/mocks/reactNativeVisionCamera'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { ScanQrCodeScreen } from './ScanQrCode.screen'
import { type ScanQrCodeScreenProps } from './ScanQrCode.types'

const memberInvite = validInvitationDatav4[0]
const deviceInvite: DeviceInvitationDataV4 = {
  ...memberInvite,
  kind: InvitationKind.Device,
  authData: { ...memberInvite.authData, userId: 'user-id', userName: 'alice' },
}

/** What the native code scanner does when a QR code is in the frame. */
const scan = (camera: ReactTestInstance, value: string) =>
  act(() => {
    camera.props.codeScanner.onCodeScanned([{ type: 'qr', value }], { width: 1280, height: 720 })
  })

describe('ScanQrCodeScreen', () => {
  beforeEach(resetVisionCameraMock)

  const routeFor = (variant: ScanQrCodeVariant): ScanQrCodeScreenProps['route'] => ({
    key: 'scan-qr-code',
    name: ScreenNames.ScanQrCodeScreen,
    params: { variant },
  })

  const renderScreen = async (variant: ScanQrCodeVariant, connected = true) => {
    const { store } = await prepareStore()
    if (connected) {
      store.dispatch(initActions.setWebsocketConnected({ dataPort: 5001, socketIOSecret: 'secret' }))
    }
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<ScanQrCodeScreen route={routeFor(variant)} />, store)
    return { dispatchSpy, result }
  }

  it('joins from a scanned member invite and goes to Choose username, as a pasted link does', async () => {
    const parsedMemberInvite: InvitationDataV4 = { ...memberInvite, kind: InvitationKind.Member }
    const { dispatchSpy, result } = await renderScreen('join')
    expect(result.getByText('Join with QR code')).toBeTruthy()

    scan(result.getByTestId('join-qr-scanner-camera'), composeInvitationShareUrl(memberInvite))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.joinCommunity({ inviteData: parsedMemberInvite }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.UsernameRegistrationScreen })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvite }))
  })

  it('links this device from a scanned device link without starting member registration', async () => {
    const { dispatchSpy, result } = await renderScreen('deviceLink')
    expect(result.getByText('Scan QR code')).toBeTruthy()
    expect(
      result.getByText('Go to “Link devices” on the other device and display the QR code. Scan it to link devices.')
    ).toBeTruthy()

    scan(result.getByTestId('link-devices-qr-scanner-camera'), composeInvitationShareUrl(deviceInvite))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvite }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.replaceScreen({ screen: ScreenNames.ConnectionProcessScreen })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(communities.actions.joinCommunity({ inviteData: deviceInvite }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.UsernameRegistrationScreen })
    )
  })

  it('accepts a device link on Join with QR code, as the paste field does', async () => {
    const { dispatchSpy, result } = await renderScreen('join')
    scan(result.getByTestId('join-qr-scanner-camera'), composeInvitationShareUrl(deviceInvite))
    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvite }))
  })

  it("keeps scanning after a code that is not a Quiet invitation and shows the paste field's error", async () => {
    const { dispatchSpy, result } = await renderScreen('join')
    scan(result.getByTestId('join-qr-scanner-camera'), 'https://example.com/menu')
    expect(result.getByTestId('join-qr-scanner-error')).toBeTruthy()
    expect(result.getByTestId('join-qr-scanner-frame')).toBeTruthy()
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: communities.actions.joinCommunity.type })
    )
  })

  it("replaces itself with the flow's paste form when the camera is denied", async () => {
    visionCameraMock.hasPermission = false
    visionCameraMock.grant = false
    const { dispatchSpy, result } = await renderScreen('deviceLink')
    await waitFor(() => expect(result.getByTestId('link-devices-qr-scanner-paste-link')).toBeTruthy())

    fireEvent.press(result.getByTestId('link-devices-qr-scanner-paste-link'))

    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.replaceScreen({ screen: ScreenNames.PasteInviteLinkScreen, params: { variant: 'deviceLink' } })
    )
  })

  it('falls back to "Paste a link to Join" from Join with QR code', async () => {
    visionCameraMock.device = undefined
    const { dispatchSpy, result } = await renderScreen('join')
    fireEvent.press(result.getByTestId('join-qr-scanner-paste-link'))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.replaceScreen({ screen: ScreenNames.PasteInviteLinkScreen, params: { variant: 'inviteLink' } })
    )
  })

  it('closes with the title bar ✕', async () => {
    const { dispatchSpy, result } = await renderScreen('join')
    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.pop())
  })

  it('shows the splash until the backend is connected, as the paste form does', async () => {
    const { result } = await renderScreen('join', false)
    expect(result.queryByTestId('join-qr-scanner-component')).toBeNull()
  })
})
