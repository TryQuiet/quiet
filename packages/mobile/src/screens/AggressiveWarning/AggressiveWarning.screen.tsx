import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { AggressiveWarningScreenProps } from './AggressiveWarning.types'
import AggressiveWarningComponent from '../../components/AggressiveWarning/AggressiveWarning.component'
import { capitalizeFirstLetter } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import { nativeServicesActions } from '../../store/nativeServices/nativeServices.slice'

export const AggressiveWarningScreen: FC<AggressiveWarningScreenProps> = ({ route }) => {
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
    <AggressiveWarningComponent
      handleBackButton={handleBackButton}
      leaveCommunity={leaveCommunity}
      communityName={communityName}
    />
  )
}
