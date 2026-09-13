import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { communities } from '@quiet/state-manager'
import {
  type InvitationData,
  isDeviceInvitationData,
  type JoinCommunityPayload,
  type LinkDevicePayload,
} from '@quiet/types'

import { ScreenNames } from '../const/ScreenNames.enum'
import { navigationActions } from '../store/navigation/navigation.slice'
import { createLogger } from '../utils/logger'

const logger = createLogger('useInvitationAction')

/**
 * What a Quiet invitation does once it is in hand, pasted or scanned: a device
 * link links this device and goes to the connection process; a member
 * invitation starts joining and goes to Choose username.
 */
export const useInvitationAction = (): ((data: InvitationData) => void) => {
  const dispatch = useDispatch()

  return useCallback(
    (data: InvitationData) => {
      if (isDeviceInvitationData(data)) {
        const payload: LinkDevicePayload = {
          inviteData: data,
        }
        logger.info('Linking this device from a device link')
        dispatch(communities.actions.linkDevice(payload))
        dispatch(
          navigationActions.replaceScreen({
            screen: ScreenNames.ConnectionProcessScreen,
          })
        )
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
    [dispatch]
  )
}
