import React from 'react'

import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import CreateChannelModal from '../../../components/widgets/channels/CreateChannelModal'

export const CreateChannelModalContainer: React.FC<{}> = () => {
  const modal = useModal(ModalName.createChannel)
  return <CreateChannelModal {...modal} />
}
export default CreateChannelModalContainer
