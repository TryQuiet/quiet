import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { capitalizeFirstLetter } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { PossibleImpersonationAttackScreenProps } from './PossibleImpersonationAttack.types'
import PossibleImpersonationAttackComponent from '../../components/PossibleImpersonationAttack/PossibleImpersonationAttack.component'

export const PossibleImpersonationAttackScreen: FC<PossibleImpersonationAttackScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const community = useSelector(communities.selectors.currentCommunity)

  let communityName = '...'
  if (community?.name) {
    communityName = capitalizeFirstLetter(community.name)
  }

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  return <PossibleImpersonationAttackComponent handleBackButton={handleBackButton} communityName={communityName} />
}
