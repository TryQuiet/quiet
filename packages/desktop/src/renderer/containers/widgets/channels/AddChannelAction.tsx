import React from 'react'
import AddChannelAction from '../../../components/widgets/channels/AddChannelAction'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const AddChannelActionContainer = () => {
  const modal = useModal(ModalName.createChannel)

  return <AddChannelAction openCreateModal={modal.handleOpen} />
}

export default AddChannelActionContainer
