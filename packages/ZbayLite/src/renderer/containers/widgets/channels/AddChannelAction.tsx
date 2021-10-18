import React from 'react'
import { bindActionCreators } from 'redux'

import AddChannelAction from '../../../components/widgets/channels/AddChannelAction'
import { actionCreators, ModalName } from '../../../store/handlers/modals'
import { useDispatch } from 'react-redux'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openCreateModal: actionCreators.openModal(ModalName.createChannel)
    },
    dispatch
  )

const AddChannelContainer: React.FC = () => {
  const dispatch = useDispatch()
  const { openCreateModal } = mapDispatchToProps(dispatch)
  return <AddChannelAction openCreateModal={openCreateModal} />
}
export default AddChannelContainer
