import { identity, users } from '@quiet/state-manager'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import CreateUsernameComponent, { UsernameVariant } from '../../CreateUsername/CreateUsernameComponent'

const UsernameTakenModalContainer = () => {
  const dispatch = useDispatch()

  const isUsernameTaken = useSelector(identity.selectors.usernameTaken)
  const usernameTakenModal = useModal(ModalName.usernameTakenModal)
  const registeredUsers = useSelector(users.selectors.certificatesMapping)
  const user = useSelector(identity.selectors.currentIdentity)

  const registerUsername = useCallback(
    (nickname: string) => {
      dispatch(
        identity.actions.registerUsername({
          nickname,
          isUsernameTaken: true,
        })
      )
    },
    [dispatch]
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
      variant={UsernameVariant.TAKEN}
      registeredUsers={registeredUsers}
      {...usernameTakenModal}
    />
  )
}

export default UsernameTakenModalContainer
