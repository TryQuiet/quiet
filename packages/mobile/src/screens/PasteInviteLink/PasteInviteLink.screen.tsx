/* eslint-disable padded-blocks */
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, type JoinCommunityError } from '@quiet/state-manager'
import { ErrorMessages, type DeviceInvitationData } from '@quiet/types'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { DeviceLinkConsent } from '../../components/DeviceLinkConsent/DeviceLinkConsent.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { useInvitationAction } from '../../hooks/useInvitationAction'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { PasteInviteLinkScreenProps } from './PasteInviteLink.types'
import { initSelectors } from '../../store/init/init.selectors'
import { confirmedDeviceLinkPayload } from '../../utils/deviceLinkConfirmation'
import { INVALID_INVITATION_ERROR } from '../../utils/inviteLink'
import { createLogger } from '../../utils/logger'

const logger = createLogger('PasteInviteLinkScreen')

/**
 * What each way a join can fail reads as under the input. Every failure is reported there,
 * where the link was typed.
 *
 * Exhaustive on purpose: the `never` makes a new kind of failure choose its words here
 * rather than compile into a field that silently says nothing.
 */
const joinErrorMessage = (error: JoinCommunityError | null): string | undefined => {
  if (!error) return undefined
  switch (error.type) {
    case 'invalid':
      return ErrorMessages.INVALID_INVITE
    case 'interrupted':
      return ErrorMessages.ADMISSION_INTERRUPTED_RETRY
    case 'timeout':
      return error.invitationType === 'device'
        ? ErrorMessages.DEVICE_ADMISSION_TIMEOUT
        : ErrorMessages.COMMUNITY_ADMISSION_TIMEOUT
    // The backend refused and said nothing about why, so this says no more than the field
    // says about a link it could not read itself.
    case 'refused':
      return INVALID_INVITATION_ERROR
    default: {
      const unreported: never = error
      return unreported
    }
  }
}

/** "Paste a link to join": the invite link, QR code and device link flows all submit here. */
export const PasteInviteLinkScreen: FC<PasteInviteLinkScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined)
  const [deviceLinkInvite, setDeviceLinkInvite] = useState<DeviceInvitationData | undefined>(undefined)

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const joinCommunityError = useSelector(communities.selectors.joinCommunityError)

  const joinCommunityErrorMessage = joinErrorMessage(joinCommunityError)

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
      logger.info('Linking this device from a pasted device link')
      dispatch(communities.actions.linkDevice(confirmedDeviceLinkPayload(data)))
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ConnectionProcessScreen,
        })
      )
    },
    [dispatch]
  )

  // Pasting and scanning submit through the same hook; a device link comes back
  // here for consent rather than being acted on.
  const joinCommunityAction = useInvitationAction(setDeviceLinkInvite)

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  // Agree & join (3054:4090) is a screen of its own, not a sheet over the paste step: it takes
  // the window while the decision is open, and its back arrow declines and returns here.
  if (deviceLinkInvite) {
    return (
      <DeviceLinkConsent
        inviteData={deviceLinkInvite}
        visible
        onConfirm={() => linkDevice(deviceLinkInvite)}
        onCancel={() => setDeviceLinkInvite(undefined)}
      />
    )
  }

  return (
    <JoinCommunity
      joinCommunityAction={joinCommunityAction}
      handleBackButton={handleBackButton}
      hasReceivedResponse={true} // always true to disable loading state feature bc not needed anymore
      invitationCode={invitationCode}
      variant={route.params?.variant ?? 'inviteLink'}
      ready={isWebsocketConnected}
      inputError={joinCommunityErrorMessage}
      onInputChange={() => dispatch(communities.actions.clearJoinCommunityError())}
    />
  )
}
