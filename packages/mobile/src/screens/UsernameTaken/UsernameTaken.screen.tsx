import React, { useCallback, useEffect } from 'react'
import { errors, identity, users } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import { UsernameTakenScreenProps } from './UsernameTaken.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { UsernameVariant } from '../../components/Registration/UsernameRegistration.types'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

const UsernameTakenScreen: React.FC<UsernameTakenScreenProps> = () => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const usernameTaken = useSelector(identity.selectors.usernameTaken)

  const usernameRegistered = currentIdentity?.userCertificate != null

  const registeredUsers = useSelector(users.selectors.certificatesMapping)

  const error = useSelector(errors.selectors.registrarErrors)

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
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

  useEffect(() => {
    if (!usernameTaken) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.ChannelListScreen,
        })
      )
    }
  }, [dispatch, usernameTaken])

  return (
    <UsernameRegistration
      registerUsernameAction={handleAction}
      usernameRegistered={usernameRegistered}
      fetching={false}
      variant={UsernameVariant.TAKEN}
      handleBackButton={handleBackButton}
      currentUsername={currentIdentity?.nickname}
      registeredUsers={registeredUsers}
    />
  )
}

export default UsernameTakenScreen
