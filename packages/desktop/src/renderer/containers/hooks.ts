import { useDispatch, useSelector } from 'react-redux'
import { modalsSelectors } from '../sagas/modals/modals.selectors'
import { modalsActions, OpenModalPayload } from '../sagas/modals/modals.slice'
import { ModalName } from '../sagas/modals/modals.types'

export class UseModalTypeWrapper<T> {
  types(e: ModalName) {
    // eslint-disable-next-line
    return useModal<T>(e)
  }
}

export const useModal = <T extends OpenModalPayload['args']>(name: ModalName) => {
  const dispatch = useDispatch()

  const open = useSelector(modalsSelectors.open(name))
  const props: T = useSelector(modalsSelectors.props(name))

  const handleOpen = (args?: T) =>
    dispatch(
      modalsActions.openModal({
        name: name,
        args: args
      })
    )

  const handleClose = () => dispatch(modalsActions.closeModal(name))

  return {
    open,
    handleOpen,
    handleClose,
    ...props
  }
}
