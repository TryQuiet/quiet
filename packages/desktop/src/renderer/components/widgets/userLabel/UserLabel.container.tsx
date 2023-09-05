import React from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import UserLabel from './UserLabel.component'
import { UserLabelType } from './UserLabel.types'

export type UserLabelContainerProps = {
  type: UserLabelType
}

const UserLabelContainer: React.FC<UserLabelContainerProps> = ({ type }) => {
  const duplicateModal = useModal(ModalName.duplicateModal)
  const unregisteredModal = useModal(ModalName.unregisteredModal)
  const modalProps = type === UserLabelType.DUPLICATE ? duplicateModal : unregisteredModal

  return <UserLabel {...modalProps} type={type} />
}

export default UserLabelContainer
