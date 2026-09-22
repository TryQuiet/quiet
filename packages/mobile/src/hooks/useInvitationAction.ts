import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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
 *
 * Nothing is acted on at all while this device already belongs to a community.
 * Quiet is one community at a time, and the backend refuses both requests in
 * that state, so the invitation is refused here instead — with the reason, which
 * the refusal by itself does not carry. It is the same rule the deep link has
 * always applied (`deepLinkSaga`), now applied wherever an invitation arrives.
 *
 * The refusal is recorded as a join error, which is what the paste field reads to
 * say it under the input. A surface with no field to report on passes
 * `onAlreadyInCommunity` and says it its own way; it is called only for the
 * invitation in hand, so no screen inherits another screen's refusal.
 */
export const useInvitationAction = (
  onDeviceInvitation: (data: DeviceInvitationData) => void,
  onAlreadyInCommunity?: () => void
): ((data: InvitationData) => void) => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  return useCallback(
    (data: InvitationData) => {
      dispatch(communities.actions.clearJoinCommunityError())

      if (currentCommunity) {
        dispatch(communities.actions.setJoinCommunityError({ type: 'alreadyMember' }))
        onAlreadyInCommunity?.()
        return
      }

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
    [currentCommunity, dispatch, onAlreadyInCommunity, onDeviceInvitation]
  )
}
