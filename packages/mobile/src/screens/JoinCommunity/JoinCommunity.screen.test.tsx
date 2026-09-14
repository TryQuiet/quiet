import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { InvitationKind, type DeviceInvitationDataV4 } from '@quiet/types'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { initActions } from '../../store/init/init.slice'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { JoinCommunityScreen } from './JoinCommunity.screen'
import type { JoinCommunityScreenProps } from './JoinCommunity.types'

describe('JoinCommunityScreen device links', () => {
  const route: JoinCommunityScreenProps['route'] = { key: 'join', name: ScreenNames.JoinCommunityScreen, params: {} }
  it('dispatches device linking instead of member registration', async () => {
    const { store } = await prepareStore()
    store.dispatch(initActions.setWebsocketConnected({ dataPort: 5001, socketIOSecret: 'secret' }))
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const deviceInvite: DeviceInvitationDataV4 = {
      ...validInvitationDatav4[0],
      kind: InvitationKind.Device,
      authData: { ...validInvitationDatav4[0].authData, userId: 'existing-user', userName: 'alice' },
    }
    const result = renderComponent(<JoinCommunityScreen route={route} />, store)
    fireEvent.changeText(result.getByPlaceholderText('Invite link'), composeInvitationShareUrl(deviceInvite))
    fireEvent.press(result.getByTestId('button'))
    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.linkDevice({ inviteData: deviceInvite }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.ConnectionProcessScreen })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.UsernameRegistrationScreen })
    )
  })
})
