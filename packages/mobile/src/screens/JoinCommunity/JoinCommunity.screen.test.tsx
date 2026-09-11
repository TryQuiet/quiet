import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { type DeviceInvitationDataV4, InvitationKind, type InvitationDataV4 } from '@quiet/types'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { initActions } from '../../store/init/init.slice'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { JoinCommunityScreen } from './JoinCommunity.screen'
import { type JoinCommunityScreenProps } from './JoinCommunity.types'

describe('JoinCommunityScreen', () => {
  const route: JoinCommunityScreenProps['route'] = {
    key: 'join-community',
    name: ScreenNames.JoinCommunityScreen,
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
    const result = renderComponent(<JoinCommunityScreen route={route} />, store)
    return { dispatchSpy, result }
  }

  it('consumes a device link without starting member registration', async () => {
    const deviceInvite: DeviceInvitationDataV4 = {
      ...validInvitationDatav4[0],
      kind: InvitationKind.Device,
      authData: {
        ...validInvitationDatav4[0].authData,
        userId: 'user-id',
        userName: 'alice',
      },
    }
    const { dispatchSpy, result } = await renderReadyScreen()

    fireEvent.changeText(result.getByPlaceholderText('Invite link'), composeInvitationShareUrl(deviceInvite))
    fireEvent.press(result.getByTestId('button'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvite }))
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

  it('keeps member invitations on the username registration flow', async () => {
    const memberInvite = validInvitationDatav4[0]
    const parsedMemberInvite: InvitationDataV4 = {
      ...memberInvite,
      kind: InvitationKind.Member,
    }
    const { dispatchSpy, result } = await renderReadyScreen()

    fireEvent.changeText(result.getByPlaceholderText('Invite link'), composeInvitationShareUrl(memberInvite))
    fireEvent.press(result.getByTestId('button'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.joinCommunity({ inviteData: parsedMemberInvite }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({
        screen: ScreenNames.UsernameRegistrationScreen,
      })
    )
  })
})
