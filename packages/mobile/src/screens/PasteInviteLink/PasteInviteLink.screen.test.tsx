import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'

import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { ErrorMessages, type DeviceInvitationDataV4, InvitationKind, type InvitationDataV4 } from '@quiet/types'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { initActions } from '../../store/init/init.slice'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { INVALID_INVITATION_ERROR, NOT_A_DEVICE_LINK_ERROR } from '../../utils/inviteLink'
import { PasteInviteLinkScreen } from './PasteInviteLink.screen'
import { type PasteInviteLinkScreenProps } from './PasteInviteLink.types'
import { confirmedDeviceLinkPayload } from '../../utils/deviceLinkConfirmation'

const deviceInvite: DeviceInvitationDataV4 = {
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device,
  authData: {
    ...validInvitationDatav4[0].authData,
    userId: 'user-id',
    userName: 'alice',
  },
}

describe('PasteInviteLinkScreen', () => {
  const route: PasteInviteLinkScreenProps['route'] = {
    key: 'paste-invite-link',
    name: ScreenNames.PasteInviteLinkScreen,
    params: {},
  }

  const renderReadyScreen = async (screenRoute: PasteInviteLinkScreenProps['route'] = route) => {
    const { store } = await prepareStore()
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<PasteInviteLinkScreen route={screenRoute} />, store)
    return { dispatchSpy, result, store }
  }

  const deviceInvite: DeviceInvitationDataV4 = {
    ...validInvitationDatav4[0],
    kind: InvitationKind.Device,
    authData: {
      ...validInvitationDatav4[0].authData,
      userId: 'user-id',
      userName: 'alice',
    },
  }
  const memberInvite = validInvitationDatav4[0]
  const parsedMemberInvite: InvitationDataV4 = {
    ...memberInvite,
    kind: InvitationKind.Member,
  }

  it('consumes a device link without starting member registration', async () => {
    const { dispatchSpy, result } = await renderReadyScreen()
    const confirmedPayload = confirmedDeviceLinkPayload(deviceInvite)

    fireEvent.changeText(result.getByPlaceholderText('Link'), composeInvitationShareUrl(deviceInvite))
    fireEvent.press(result.getByTestId('paste-link-continue'))
    // Linking a device is never done without consent.
    fireEvent.press(await result.findByTestId('device-link-confirm'))

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice(confirmedPayload)))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.replaceScreen({
        screen: ScreenNames.ConnectionProcessScreen,
      })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(communities.actions.joinCommunity({ inviteData: deviceInvite }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.navigation({
        screen: ScreenNames.UsernameRegistrationScreen,
      })
    )
  })

  it('keeps a cancelled device link on the paste screen without dispatching it', async () => {
    const { dispatchSpy, result } = await renderReadyScreen()

    fireEvent.changeText(result.getByPlaceholderText('Link'), composeInvitationShareUrl(deviceInvite))
    fireEvent.press(result.getByTestId('paste-link-continue'))

    // Agree & join takes the window; its back arrow is how the user declines (3054:4090).
    expect(await result.findByTestId('device-link-consent')).toBeTruthy()
    fireEvent.press(result.getByTestId('appbar_action_item'))

    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: communities.actions.linkDevice.type }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: navigationActions.replaceScreen.type })
    )
    // Declining returns to the paste step, with the field still there.
    expect(result.getByPlaceholderText('Link')).toBeTruthy()
  })

  it('keeps member invitations on the username registration flow', async () => {
    const { dispatchSpy, result } = await renderReadyScreen()

    fireEvent.changeText(result.getByPlaceholderText('Link'), composeInvitationShareUrl(memberInvite))
    fireEvent.press(result.getByTestId('paste-link-continue'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.joinCommunity({ inviteData: parsedMemberInvite }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({
        screen: ScreenNames.UsernameRegistrationScreen,
      })
    )
  })

  describe('Link devices → Paste link (variant pasteDeviceLink)', () => {
    const pasteLinkRoute: PasteInviteLinkScreenProps['route'] = {
      ...route,
      params: { variant: 'pasteDeviceLink' },
    }

    it('shows the paste step with no bar title (an h1 screen)', async () => {
      const { result } = await renderReadyScreen(pasteLinkRoute)

      expect(result.queryByText('Link devices')).toBeNull()
      expect(result.getByText('Paste a link to join')).toBeTruthy()
      expect(result.getByPlaceholderText('Link')).toBeTruthy()
    })

    it('a device link links this device once its consent is given', async () => {
      const { dispatchSpy, result } = await renderReadyScreen(pasteLinkRoute)

      fireEvent.changeText(result.getByPlaceholderText('Link'), composeInvitationShareUrl(deviceInvite))
      fireEvent.press(result.getByTestId('paste-link-continue'))

      // Linking hands the other device this account, so the paste raises the consent drawer and
      // dispatches nothing until it is confirmed.
      expect(result.getByTestId('device-link-consent')).toBeTruthy()
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: communities.actions.linkDevice.type })
      )

      fireEvent.press(result.getByTestId('device-link-confirm'))

      // The screen dispatches develop's confirmed payload (deviceLinkConsent: true).
      expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice(confirmedDeviceLinkPayload(deviceInvite)))
      expect(dispatchSpy).toHaveBeenCalledWith(
        navigationActions.replaceScreen({
          screen: ScreenNames.ConnectionProcessScreen,
        })
      )
      expect(result.queryByText(NOT_A_DEVICE_LINK_ERROR)).toBeNull()
    })

    it('a member link shows the not-a-device-link error and dispatches nothing', async () => {
      const { dispatchSpy, result } = await renderReadyScreen(pasteLinkRoute)

      fireEvent.changeText(result.getByPlaceholderText('Link'), composeInvitationShareUrl(memberInvite))
      fireEvent.press(result.getByTestId('paste-link-continue'))

      expect(result.getByText(NOT_A_DEVICE_LINK_ERROR)).toBeTruthy()
      expect(result.getByPlaceholderText('Link')).toBeTruthy() // still on the paste step
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        communities.actions.joinCommunity({ inviteData: parsedMemberInvite })
      )
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: communities.actions.linkDevice.type })
      )
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        navigationActions.navigation({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        navigationActions.replaceScreen({
          screen: ScreenNames.ConnectionProcessScreen,
        })
      )
    })

    it('text that is not an invitation shows the invalid-code error', async () => {
      const { dispatchSpy, result } = await renderReadyScreen(pasteLinkRoute)

      fireEvent.changeText(result.getByPlaceholderText('Link'), 'https://example.com/')
      fireEvent.press(result.getByTestId('paste-link-continue'))

      expect(result.getByText('Please check your invite link and try again')).toBeTruthy()
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: communities.actions.linkDevice.type })
      )
    })

    it('the Scan QR code stand-in (variant deviceLink) rejects a member link the same way', async () => {
      const { dispatchSpy, result } = await renderReadyScreen({ ...route, params: { variant: 'deviceLink' } })

      fireEvent.changeText(result.getByPlaceholderText('Link'), composeInvitationShareUrl(memberInvite))
      fireEvent.press(result.getByTestId('paste-link-continue'))

      expect(result.getByText(NOT_A_DEVICE_LINK_ERROR)).toBeTruthy()
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        communities.actions.joinCommunity({ inviteData: parsedMemberInvite })
      )
    })
  })

  /**
   * A join that fails is reported where the link was typed. Every kind the backend
   * reports lands under this screen's input, and the screen keeps the window: nothing
   * navigates away to Join community or Get started to say it.
   */
  describe('reports a failed join on the invite field', () => {
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
      // The backend refused and said nothing about why, so the field says no more than it
      // says about a link it could not read itself.
      ['a request the backend refused outright', { type: 'refused' }, INVALID_INVITATION_ERROR],
    ]

    describe.each(errorKinds)('%s', (_kind, joinCommunityError, message) => {
      it('shows the message under the input, staying on the paste screen', async () => {
        const { dispatchSpy, result, store } = await renderReadyScreen()
        act(() => {
          store.dispatch(communities.actions.setJoinCommunityError(joinCommunityError))
        })

        const error = await result.findByText(message)
        expect(error).toBeTruthy()
        // Under the input, in the field's own error slot - not a screen of its own.
        expect(result.getByTestId('paste-link-input')).toContainElement(error)
        expect(result.getByText('Paste a link to join')).toBeTruthy()
        expect(dispatchSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: navigationActions.navigation.type })
        )
        expect(dispatchSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: navigationActions.replaceScreen.type })
        )
        expect(dispatchSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: navigationActions.resetToScreen.type })
        )
      })

      it('drops the message when the link is edited, keeping what was typed', async () => {
        const { dispatchSpy, result, store } = await renderReadyScreen()
        act(() => {
          store.dispatch(communities.actions.setJoinCommunityError(joinCommunityError))
        })
        expect(await result.findByText(message)).toBeTruthy()

        const input = result.getByPlaceholderText('Link')
        act(() => {
          fireEvent.changeText(input, 'another-link')
        })

        await waitFor(() => expect(result.queryByText(message)).toBeNull())
        expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.clearJoinCommunityError())
        // Clearing the message must not take the new link with it: submitting now has to
        // carry what was typed, not an empty field.
        fireEvent.press(result.getByTestId('paste-link-continue'))
        expect(result.queryByText('Community address can not be empty')).toBeNull()
        expect(result.getByText('Please check your invite link and try again')).toBeTruthy()
      })
    })
  })
})
