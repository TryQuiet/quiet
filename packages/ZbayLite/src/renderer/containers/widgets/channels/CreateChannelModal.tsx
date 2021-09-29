import React from 'react'

import { ModalName, useModal } from '../../../store/handlers/modals'
import CreateChannelModal from '../../../components/widgets/channels/CreateChannelModal'

export const CreateChannelModalContainer: React.FC<{}> = () => {
  const modal = useModal(ModalName.createChannel)
  return <CreateChannelModal {...modal} />
}
export default CreateChannelModalContainer
