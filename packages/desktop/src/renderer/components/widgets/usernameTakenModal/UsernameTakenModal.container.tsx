import { identity } from '@quiet/state-manager'
import React from 'react'
import { useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import CreateUsernameComponent, { UsernameVariant } from '../../CreateUsername/CreateUsernameComponent'

const UsernameTakenModalContainer = () => {
  const usernameTakenModal = useModal(ModalName.usernameTakenModal)

  const enterUsername = (username: string) => {
    console.log({ username })
  }

  const user = useSelector(identity.selectors.currentIdentity)

  return (
    <CreateUsernameComponent
      currentUsername={user?.nickname}
      registerUsername={enterUsername}
      variant={UsernameVariant.TAKEN}
      {...usernameTakenModal}
    />
  )
}

export default UsernameTakenModalContainer
