/* eslint-disable padded-blocks */
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { InvitationData, isDeviceInvitationData, JoinCommunityPayload, LinkDevicePayload } from '@quiet/types'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { PasteInviteLinkScreenProps } from './PasteInviteLink.types'
import { initSelectors } from '../../store/init/init.selectors'
import { createLogger } from '../../utils/logger'

const logger = createLogger('PasteInviteLinkScreen')

/** "Paste a link to Join": the invite link, QR code and device link flows all submit here. */
export const PasteInviteLinkScreen: FC<PasteInviteLinkScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined)

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  // Handle deep linking (opening app with quiet://)
  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    // Change component state
    setInvitationCode(code)
  }, [dispatch, currentCommunity, route.params?.code])

  const joinCommunityAction = useCallback(
    (data: InvitationData) => {
      if (isDeviceInvitationData(data)) {
        const payload: LinkDevicePayload = {
          inviteData: data,
        }
        logger.info('Linking this device from a pasted device link')
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

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  return (
    <JoinCommunity
      joinCommunityAction={joinCommunityAction}
      handleBackButton={handleBackButton}
      hasReceivedResponse={true} // always true to disable loading state feature bc not needed anymore
      invitationCode={invitationCode}
      variant={route.params?.variant ?? 'inviteLink'}
      ready={isWebsocketConnected}
    />
  )
}
