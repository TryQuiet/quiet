import React from 'react'
import { bindActionCreators } from 'redux'
import { useDispatch } from 'react-redux'

import UpdateModal from '../../../components/widgets/update/UpdateModal'
import updateHandlers from '../../../store/handlers/update'
import { ModalName, useModal } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      handleUpdate: updateHandlers.epics.startApplicationUpdate,
      rejectUpdate: updateHandlers.epics.declineUpdate
    },
    dispatch
  )

const ApplicationUpdateModal: React.FC = () => {
  const dispatch = useDispatch()
  const actions = mapDispatchToProps(dispatch)
  const modal = useModal(ModalName.applicationUpdate)
  return <UpdateModal {...modal} {...actions} />
}
export default ApplicationUpdateModal
