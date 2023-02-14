import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { CreateCommunity } from '../../components/CreateCommunity/CreateCommunity.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

export const CreateCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  const createCommunityAction = useCallback(
    (name: string) => {
      console.log(`Creting community ${name}`)
    },
    [dispatch]
  )

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.JoinCommunityScreen
      })
    )
  }, [dispatch])

  return (
    <CreateCommunity
      createCommunityAction={createCommunityAction}
      redirectionAction={redirectionAction}
    />
  )
}
