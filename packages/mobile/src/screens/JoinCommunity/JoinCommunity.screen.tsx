/* eslint-disable padded-blocks */
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities } from '@quiet/state-manager'
import { InvitationData, JoinCommunityPayload } from '@quiet/types'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { JoinCommunityScreenProps } from './JoinCommunity.types'
import { initSelectors } from '../../store/init/init.selectors'
import { createLogger } from '../../utils/logger'

const logger = createLogger('JoinCommunityScreen')

export const JoinCommunityScreen: FC<JoinCommunityScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined)

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)

  const hasReceivedResponse = Boolean(invitationCodes === null)

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
    <JoinCommunity
      joinCommunityAction={joinCommunityAction}
      redirectionAction={redirectionAction}
      hasReceivedResponse={true}
      invitationCode={invitationCode}
      ready={isWebsocketConnected}
    />
  )
}
