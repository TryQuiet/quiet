import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'

import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

import { LeaveCommunity } from '../../components/LeaveCommunity/LeaveCommunity.component'

import { capitalize } from '../../utils/functions/capitalize/capitalize'

export const LeaveCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  const community = useSelector(communities.selectors.currentCommunity)

  let name = ''
  if (community) {
    name = capitalize(community.name)
  }

  const leaveCommunity = () => {
    console.log('leaving community')
  }

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ChannelListScreen
      })
    )
    return true
  }, [dispatch])

  return <LeaveCommunity name={name} leaveCommunity={leaveCommunity} handleBackButton={handleBackButton} />
}
