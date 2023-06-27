/* eslint-disable padded-blocks */
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities } from '@quiet/state-manager'
import { CommunityOwnership, CreateNetworkPayload } from '@quiet/types'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { JoinCommunityScreenProps } from './JoinCommunity.types'

export const JoinCommunityScreen: FC<JoinCommunityScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const networkCreated = Boolean(currentCommunity && !currentIdentity?.userCertificate)

  const community = useSelector(communities.selectors.currentCommunity)

  // Handle deep linking (opening app with quiet://)
  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    // Change component state
    setInvitationCode(code)
  }, [dispatch, community, route.params?.code])

  useEffect(() => {
    if (networkCreated) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
    }
  }, [dispatch, currentCommunity])

  const joinCommunityAction = useCallback(
    (address: string) => {
      const payload: CreateNetworkPayload = {
        ownership: CommunityOwnership.User,
        registrar: address,
      }
      dispatch(communities.actions.createNetwork(payload))
    },
    [dispatch]
  )

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.CreateCommunityScreen,
      })
    )
  }, [dispatch])

  return (
    <JoinCommunity
      joinCommunityAction={joinCommunityAction}
      redirectionAction={redirectionAction}
      networkCreated={networkCreated}
      invitationCode={invitationCode}
    />
  )
}
