import { useCallback, useEffect, useState } from 'react'
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

export const useCyclingFocus = (
  listSize: number,
  initialFocus: number = null
): [number, React.Dispatch<React.SetStateAction<number>>] => {
  const [currentFocus, setCurrentFocus] = useState<number>(initialFocus)

  const handleKeyDown = useCallback<(evt: KeyboardEvent) => void>(
    (evt) => {
      // Cycle up or down. Also start over if we're outside the list bounds.
      switch (evt.key) {
        case 'ArrowDown':
          evt.preventDefault()

          setCurrentFocus(
            currentFocus === null ? 0 : currentFocus === listSize - 1 ? 0 : currentFocus + 1
          )
          break
        case 'ArrowUp':
          evt.preventDefault()
          setCurrentFocus(
            currentFocus === null
              ? listSize - 1
              : currentFocus === 0
                ? listSize - 1
                : currentFocus - 1
          )
          break
      }
    },
  [listSize, currentFocus, setCurrentFocus]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [handleKeyDown])

  return [currentFocus, setCurrentFocus]
}
