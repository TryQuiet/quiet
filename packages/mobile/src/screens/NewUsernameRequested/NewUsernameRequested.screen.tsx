import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import NewUsernameRequestedComponent from '../../components/NewUsernameRequested/NewUsernameRequested.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { NewUsernameRequestedScreenProps } from './NewUsernameRequested.types'

const NewUsernameRequestedScreen: React.FC<NewUsernameRequestedScreenProps> = () => {
  const dispatch = useDispatch()

  const handler = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen,
      })
    )
  }, [dispatch])
  return <NewUsernameRequestedComponent handler={handler} />
}

export default NewUsernameRequestedScreen
