import React, { useCallback } from 'react'
import { identity, users } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import { UsernameTakenScreenProps } from './UsernameTaken.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { UsernameVariant } from '../../components/Registration/UsernameRegistration.types'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

const UsernameTakenScreen: React.FC<UsernameTakenScreenProps> = () => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const usernameRegistered = currentIdentity?.userCertificate != null

  const registeredUsers = useSelector(users.selectors.certificatesMapping)

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const handleAction = (nickname: string) => {
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
