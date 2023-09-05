import React from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import UserLabel from './UserLabel.component'
import { UserLabelType } from './UserLabel.types'

interface UserLabelContainerProps {
  type: UserLabelType
  username: string
}

const UserLabelContainer: React.FC<UserLabelContainerProps> = ({ type, username }) => {
  const { handleOpen: duplicateHandleOpen } = useModal(ModalName.duplicateModal)
  const { handleOpen: unregisteredHandleOpen } = useModal(ModalName.unregisteredModal)

  const handleOpen = type === UserLabelType.DUPLICATE ? duplicateHandleOpen : unregisteredHandleOpen

  return <UserLabel handleOpen={() => handleOpen({ username })} type={type} />
}

export default UserLabelContainer
