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

  const renderReadyScreen = async () => {
    const { store } = await prepareStore()
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const result = renderComponent(<PasteInviteLinkScreen route={route} />, store)
    return { dispatchSpy, result, store }
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
    fireEvent.press(await result.findByTestId('device-link-cancel'))

    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: communities.actions.linkDevice.type }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: navigationActions.replaceScreen.type })
    )
  })

  it('keeps member invitations on the username registration flow', async () => {
    const memberInvite = validInvitationDatav4[0]
    const parsedMemberInvite: InvitationDataV4 = {
      ...memberInvite,
      kind: InvitationKind.Member,
    }
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

  it('shows the timeout error on the paste screen', async () => {
    const { store, result } = await renderReadyScreen()
    act(() => {
      store.dispatch(
        communities.actions.setJoinCommunityError({
          type: 'timeout',
          invitationType: 'device',
        })
      )
    })

    expect(await result.findByText(ErrorMessages.DEVICE_ADMISSION_TIMEOUT)).toBeTruthy()
  })

  it('shows the interrupted error on the paste screen', async () => {
    const { store, result } = await renderReadyScreen()
    act(() => {
      store.dispatch(
        communities.actions.setJoinCommunityError({
          type: 'interrupted',
          invitationType: 'community',
        })
      )
    })

    expect(await result.findByText(ErrorMessages.ADMISSION_INTERRUPTED_RETRY)).toBeTruthy()
  })
})
