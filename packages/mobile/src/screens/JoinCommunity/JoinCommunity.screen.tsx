/* eslint-disable padded-blocks */
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities } from '@quiet/state-manager'
import {
  ErrorMessages,
  InvitationData,
  isDeviceInvitationData,
  JoinCommunityPayload,
  type DeviceInvitationData,
} from '@quiet/types'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import DeviceLinkConsentDrawer from '../../components/ModalBottomDrawer/drawers/DeviceLinkConsent.drawer'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { JoinCommunityScreenProps } from './JoinCommunity.types'
import { initSelectors } from '../../store/init/init.selectors'
import { createLogger } from '../../utils/logger'
import { confirmedDeviceLinkPayload } from '../../utils/deviceLinkConfirmation'

const logger = createLogger('JoinCommunityScreen')

export const JoinCommunityScreen: FC<JoinCommunityScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined)
  const [deviceLinkInvite, setDeviceLinkInvite] = useState<DeviceInvitationData | undefined>(undefined)

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const joinCommunityError = useSelector(communities.selectors.joinCommunityError)

  const joinCommunityErrorMessage =
    joinCommunityError?.type === 'invalid'
      ? ErrorMessages.INVALID_INVITE
      : joinCommunityError?.type === 'interrupted'
      ? ErrorMessages.ADMISSION_INTERRUPTED_RETRY
      : joinCommunityError?.type === 'timeout'
      ? joinCommunityError.invitationType === 'device'
        ? ErrorMessages.DEVICE_ADMISSION_TIMEOUT
        : ErrorMessages.COMMUNITY_ADMISSION_TIMEOUT
      : undefined

  const hasReceivedResponse = Boolean(invitationCodes === null)

  // Handle deep linking (opening app with quiet://)
  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    // Change component state
    setInvitationCode(code)
  }, [dispatch, currentCommunity, route.params?.code])

  const linkDevice = useCallback(
    (data: DeviceInvitationData) => {
      dispatch(communities.actions.linkDevice(confirmedDeviceLinkPayload(data)))
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ConnectionProcessScreen,
        })
      )
    },
    [dispatch]
  )

  const joinCommunityAction = useCallback(
    (data: InvitationData) => {
      dispatch(communities.actions.clearJoinCommunityError())
      if (isDeviceInvitationData(data)) {
        setDeviceLinkInvite(data)
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

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.CreateCommunityScreen,
      })
    )
  }, [dispatch])

  return (
    <>
      <JoinCommunity
        joinCommunityAction={joinCommunityAction}
        redirectionAction={redirectionAction}
        hasReceivedResponse={true} // always true to disable loading state feature bc not needed anymore
        invitationCode={invitationCode}
        ready={isWebsocketConnected}
        inputError={joinCommunityErrorMessage}
        onInputChange={() => dispatch(communities.actions.clearJoinCommunityError())}
      />
      <DeviceLinkConsentDrawer
        inviteData={deviceLinkInvite}
        onConfirm={() => {
          if (!deviceLinkInvite) return
          linkDevice(deviceLinkInvite)
        }}
        onCancel={() => setDeviceLinkInvite(undefined)}
      />
    </>
  )
}
