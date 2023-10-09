import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { capitalizeFirstLetter } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { nativeServicesActions } from '../../store/nativeServices/nativeServices.slice'
import { PossibleImpersonationAttackScreenProps } from './PossibleImpersonationAttack.types'
import PossibleImpersonationAttackComponent from '../../components/PossibleImpersonationAttack/PossibleImpersonationAttack.component'

export const PossibleImpersonationAttackScreen: FC<PossibleImpersonationAttackScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const community = useSelector(communities.selectors.currentCommunity)

  let communityName = '...'
  if (community?.name) {
    communityName = capitalizeFirstLetter(community.name)
  }

  const leaveCommunity = useCallback(() => {
    dispatch(nativeServicesActions.leaveCommunity())
  }, [dispatch])

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen,
      })
    )
  }, [dispatch])

  return (
    <PossibleImpersonationAttackComponent
      handleBackButton={handleBackButton}
      leaveCommunity={leaveCommunity}
      communityName={communityName}
    />
  )
}
