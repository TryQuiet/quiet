import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'

import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

import { LeaveCommunity } from '../../components/LeaveCommunity/LeaveCommunity.component'

import { nativeServicesActions } from '../../store/nativeServices/nativeServices.slice'
import { capitalizeFirstLetter } from '@quiet/common'

export const LeaveCommunityScreen: FC = () => {
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
      navigationActions.navigation({
        screen: ScreenNames.ChannelListScreen,
      })
    )
    return true
  }, [dispatch])

  return <LeaveCommunity name={communityName} leaveCommunity={leaveCommunity} handleBackButton={handleBackButton} />
}
