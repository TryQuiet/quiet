import React, { useCallback, useEffect, useState } from 'react'
import { errors, identity, users } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import { UsernameTakenScreenProps } from './UsernameTaken.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { UsernameVariant } from '../../components/Registration/UsernameRegistration.types'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

const UsernameTakenScreen: React.FC<UsernameTakenScreenProps> = () => {
  const dispatch = useDispatch()

  const [ username, setUsername ] = useState<string | undefined>(undefined)

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const usernameRegistered = currentIdentity?.nickname == username

  const registeredUsers = useSelector(users.selectors.certificatesMapping)

  const error = useSelector(errors.selectors.registrarErrors)

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const navigation = useCallback(
    (screen: ScreenNames, params?: any) => {
      dispatch(
        navigationActions.navigation({
          screen,
          params,
        })
      )
    },
    [dispatch]
  )

  const handleAction = (nickname: string) => {
    // Clear errors
    if (error) {
      dispatch(errors.actions.clearError(error))
    }

    setUsername(nickname)

    dispatch(
      identity.actions.chooseUsername({ nickname: nickname })
    )
  }

  useEffect(() => {
    if (usernameRegistered) {
      dispatch(identity.actions.saveUserCsr())
      navigation(ScreenNames.NewUsernameRequestedScreen)
    }
  }, [dispatch, username, currentIdentity])

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
