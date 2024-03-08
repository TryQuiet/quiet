import React, { useCallback, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

import Modal from '../../ui/Modal/Modal'

import { identity, users } from '@quiet/state-manager'

import ChangeUsername from '../../ChangeUsername/ChangeUsername.component'
import UsernameChanged from '../../ChangeUsername/UsernameChanged/UsernameChanged.component'

const UsernameTakenModalContainer = () => {
  const dispatch = useDispatch()

  const [requestedUsername, setRequestedUsername] = React.useState<boolean>(false)
  const [registrationError, setRegistrationError] = React.useState<string | null>(null)

  const usernameTaken = useSelector(identity.selectors.usernameTaken)

  const modal = useModal(ModalName.usernameTakenModal)

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

      setRequestedUsername(true)
    },
    [dispatch, user, registeredUsernames, setRegistrationError]
  )

  useEffect(() => {
    if (usernameTaken) {
      modal.handleOpen()
    } else {
      modal.handleClose()
    }
  }, [usernameTaken])

  return (
    <Modal title={!requestedUsername ? 'Username taken' : 'New username requested'} isBold addBorder {...modal}>
      {!requestedUsername ? (
        <ChangeUsername
          currentUsername={user?.nickname}
          registerUsername={registerUsername}
          registrationError={registrationError}
          {...modal}
        />
      ) : (
        <UsernameChanged {...modal} />
      )}
    </Modal>
  )
}

export default UsernameTakenModalContainer
