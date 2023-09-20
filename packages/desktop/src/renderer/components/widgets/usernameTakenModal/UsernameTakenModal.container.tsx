import React from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

const UsernameTakenModalContainer = () => {
  const usernameTakenModal = useModal(ModalName.usernameTakenModal)

  const enterUsername = () => {}

  const currentUsername = 'johhny'

  return <p>test</p>
}

export default UsernameTakenModalContainer
