import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import CreateUsernameComponent, { UsernameVariant } from '../../CreateUsername/CreateUsernameComponent'
import { identity, users } from '@quiet/state-manager'

const UsernameTakenModalContainer = () => {
  const dispatch = useDispatch()

  const [registrationError, setRegistrationError] = React.useState<string | null>(null)

  const isUsernameTaken = useSelector(identity.selectors.usernameTaken)
  const usernameTakenModal = useModal(ModalName.usernameTakenModal)

  const registeredUsernames = useSelector(users.selectors.registeredUsernames)

  const user = useSelector(identity.selectors.currentIdentity)

  const registerUsername = useCallback(
    (nickname: string) => {
      // Reset registration error
      setRegistrationError(null)

      // Trying to register the same username
      if (nickname === user?.nickname) {
        setRegistrationError('You cannot register with this username.')
        return 
      }

      // Trying to register another already taken username
      if (registeredUsernames.has(nickname)) {
        setRegistrationError(`${nickname} is already taken`)
      }

      dispatch(
        identity.actions.registerUsername({
          nickname,
          isUsernameTaken: true,
        })
      )
    },
    [dispatch, user, registeredUsernames, setRegistrationError]
  )

  useEffect(() => {
    if (isUsernameTaken) {
      usernameTakenModal.handleOpen()
    } else {
      usernameTakenModal.handleClose()
    }
  }, [isUsernameTaken])

  return (
    <CreateUsernameComponent
      currentUsername={user?.nickname}
      registerUsername={registerUsername}
      registrationError={registrationError}
      variant={UsernameVariant.TAKEN}
      {...usernameTakenModal}
    />
  )
}

export default UsernameTakenModalContainer
