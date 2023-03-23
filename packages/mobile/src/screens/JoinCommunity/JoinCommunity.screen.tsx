import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities, CommunityOwnership, CreateNetworkPayload } from '@quiet/state-manager'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { JoinCommunityScreenProps } from './JoinCommunity.types'
import { appImages } from '../../../assets'

export const JoinCommunityScreen: FC<JoinCommunityScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined)

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const community = useSelector(communities.selectors.currentCommunity)

  const replaceScreen = useCallback((screen: ScreenNames, params?: any) => {
    dispatch(navigationActions.replaceScreen({
      screen: screen,
      params: params
    }))
  }, [dispatch])

  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    // The same url has been used to open an app
    if (community && community.registrarUrl.includes(code)) {
      dispatch(navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen
      }))
      return
    }

    // User already belongs to a community
    if (community) {
      dispatch(navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.ChannelListScreen),
          icon: appImages.quiet_icon_round,
          title: 'You already belong to a community',
          message: 'We\'re sorry but for now you can only be a member of a single community at a time'
        }
      }))
      return
    }

    // Set invitation code and continue
    setInvitationCode(code)

    joinCommunityAction(code)

  }, [dispatch, community, route.params?.code])

  useEffect(() => {
    if (currentIdentity && !currentIdentity.userCertificate) {
      dispatch(navigationActions.navigation({
        screen: ScreenNames.UsernameRegistrationScreen
       }))
    }
  }, [dispatch, currentIdentity])

  const joinCommunityAction = useCallback((address: string) => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      registrar: address
    }
    dispatch(communities.actions.createNetwork(payload))
  }, [dispatch])

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.CreateCommunityScreen
      })
    )
  }, [dispatch])

  return (
    <JoinCommunity joinCommunityAction={joinCommunityAction} redirectionAction={redirectionAction} invitationCode={invitationCode} />
  )
}
