import { identity } from '@quiet/state-manager'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import CreateUsernameComponent, { UsernameVariant } from '../../CreateUsername/CreateUsernameComponent'

const UsernameTakenModalContainer = () => {
  const dispatch = useDispatch()
  const isUsernameTaken = useSelector(identity.selectors.usernameTaken)
  const usernameTakenModal = useModal(ModalName.usernameTakenModal)

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

  const user = useSelector(identity.selectors.currentIdentity)

  useEffect(() => {
    if (isUsernameTaken) {
      usernameTakenModal.handleOpen()
    }
  }, [isUsernameTaken])

  return (
    <CreateUsernameComponent
      currentUsername={user?.nickname}
      registerUsername={registerUsername}
      variant={UsernameVariant.TAKEN}
      {...usernameTakenModal}
    />
  )
}

export default UsernameTakenModalContainer
