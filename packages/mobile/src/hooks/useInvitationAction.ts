import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { communities } from '@quiet/state-manager'
import {
  type DeviceInvitationData,
  type InvitationData,
  isDeviceInvitationData,
  type JoinCommunityPayload,
} from '@quiet/types'

import { ScreenNames } from '../const/ScreenNames.enum'
import { navigationActions } from '../store/navigation/navigation.slice'

/**
 * What a Quiet invitation does once it is in hand, pasted or scanned: a member
 * invitation starts joining and goes to Choose username.
 *
 * A device link is not acted on here. Linking hands the other device this
 * account, so it is never done without consent: the invitation is handed back
 * to the caller, which shows the consent drawer and only then dispatches
 * `linkDevice` with `confirmedDeviceLinkPayload`. Pasting and scanning share
 * this hook, so neither one can link a device without that step.
 */
export const useInvitationAction = (
  onDeviceInvitation: (data: DeviceInvitationData) => void
): ((data: InvitationData) => void) => {
  const dispatch = useDispatch()

  return useCallback(
    (data: InvitationData) => {
      dispatch(communities.actions.clearJoinCommunityError())

      if (isDeviceInvitationData(data)) {
        onDeviceInvitation(data)
        return
      }

      const payload: JoinCommunityPayload = {
        inviteData: data,
      }
      dispatch(communities.actions.joinCommunity(payload))
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
    },
    [dispatch, onDeviceInvitation]
  )
}
