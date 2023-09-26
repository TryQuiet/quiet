import React, { useCallback } from 'react'
import { errors, identity } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import { UsernameTakenScreenProps } from './UsernameTaken.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { ErrorCodes } from '@quiet/types'
import { UsernameVariant } from '../../components/Registration/UsernameRegistration.types'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

const UsernameTakenScreen: React.FC<UsernameTakenScreenProps> = () => {
  const dispatch = useDispatch()
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const usernameRegistered = currentIdentity?.userCertificate != null
  const error = useSelector(errors.selectors.registrarErrors)

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen,
      })
    )
  }, [dispatch])

  const handleAction = (nickname: string) => {
    // Clear errors
    if (error) {
      dispatch(errors.actions.clearError(error))
    }
    dispatch(
      identity.actions.registerUsername({
        nickname,
        isUsernameTaken: true,
      })
    )
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.NewUsernameRequestedScreen,
      })
    )
  }

  return (
    <UsernameRegistration
      registerUsernameAction={handleAction}
      registerUsernameError={error?.code === ErrorCodes.FORBIDDEN ? error.message : undefined}
      usernameRegistered={usernameRegistered}
      fetching={false}
      variant={UsernameVariant.TAKEN}
      handleBackButton={handleBackButton}
      currentUsername={currentIdentity?.nickname}
    />
  )
}

export default UsernameTakenScreen
