import React, { FC, useEffect } from 'react'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'
import { initActions } from '../../store/init/init.slice'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { identity, communities, CommunityOwnership, CreateNetworkPayload } from '@quiet/state-manager'

export const JoinCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.JoinCommunityScreen))
  })

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  useEffect(() => {
    if (currentIdentity && !currentIdentity.userCertificate) {
      replaceScreen(ScreenNames.UsernameRegistrationScreen)
    }
  }, [currentIdentity])

  const joinCommunityAction = (address: string) => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      registrar: address
    }
    dispatch(communities.actions.createNetwork(payload))
  }

  return (
    <View style={{ flex: 1 }}>
      <JoinCommunity joinCommunityAction={joinCommunityAction} />
    </View>
  )
}
