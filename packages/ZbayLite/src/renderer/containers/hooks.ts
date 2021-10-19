import { useDispatch, useSelector } from 'react-redux'
import { modalsSelectors } from '../sagas/modals/modals.selectors'
import { modalsActions } from '../sagas/modals/modals.slice'
import { ModalName } from '../sagas/modals/modals.types'

export const useModal = (name: ModalName) => {
  const dispatch = useDispatch()

  const open = useSelector(modalsSelectors.open(name))
  const handleOpen = () => dispatch(modalsActions.openModal(name))
  const handleClose = () => dispatch(modalsActions.closeModal(name))

  return {
    open,
    handleOpen,
    handleClose
  }
}
