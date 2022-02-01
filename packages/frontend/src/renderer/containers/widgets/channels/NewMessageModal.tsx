import React from 'react'

import { useModal } from '../../hooks'
import NewMessageModal from '../../../components/widgets/channels/NewMessageModal'

import { ModalName } from '../../../sagas/modals/modals.types'

const NewMessage: React.FC = () => {
  const modal = useModal(ModalName.newMessageSeparate)
  return <NewMessageModal {...modal} users={{}} sendMessage={() => null} />
}
export default NewMessage
