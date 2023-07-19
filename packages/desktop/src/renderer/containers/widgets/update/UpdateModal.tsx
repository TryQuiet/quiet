import React from 'react'
import { AnyAction, Dispatch, bindActionCreators } from 'redux'
import { useDispatch } from 'react-redux'

import UpdateModal from '../../../components/widgets/update/UpdateModal'
import updateHandlers from '../../../store/handlers/update'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) =>
  bindActionCreators(
    {
      handleUpdate: updateHandlers.epics.startApplicationUpdate,
      rejectUpdate: updateHandlers.epics.declineUpdate,
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
