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

export enum Variant {
  ARROWS_KEYS = 'arrows-keys',
  PAGES_KEYS = 'pages-keys'
}

export const useCyclingFocus = (
  listSize: number,
  variant: Variant,
  initialFocus: number = null
): [number, React.Dispatch<React.SetStateAction<number>>] => {
  const [currentFocus, setCurrentFocus] = useState<number>(initialFocus)

  const handleDown = (evt: KeyboardEvent, focusValue: number): number => {
    evt.preventDefault()
    if (currentFocus === null) {
      focusValue = 0
    } else if (currentFocus !== listSize - 1) {
      focusValue = currentFocus + 1
    }
    setCurrentFocus(focusValue)
    return focusValue
  }

  const handleUp = (evt: KeyboardEvent, focusValue: number): number => {
    evt.preventDefault()
    if (currentFocus === null) {
      focusValue = listSize - 1
    }
    if (currentFocus === 0) {
      focusValue = listSize - 1
    } else {
      focusValue = currentFocus - 1
    }
    setCurrentFocus(focusValue)
    return focusValue
  }

  const handleKeyDown = useCallback<(evt: KeyboardEvent) => void>(
    evt => {
      let focusValue = 0
      // Cycle up or down. Also start over if we're outside the list bounds.

      if (variant === Variant.PAGES_KEYS) {
        switch (evt.key) {
          case 'PageDown':
            focusValue = handleDown(evt, focusValue)
            break
          case 'PageUp':
            focusValue = handleUp(evt, focusValue)
            break
        }
      }
      if (variant === Variant.ARROWS_KEYS) {
        switch (evt.key) {
          case 'ArrowDown':
            focusValue = handleDown(evt, focusValue)
            break
          case 'ArrowUp':
            focusValue = handleUp(evt, focusValue)
            break
        }
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

export const useEnterPress = (fn, rerender): any => {
  const handleKeyDown = useCallback<(evt: KeyboardEvent) => void>(
    evt => {
      evt.preventDefault()
      if (evt.key === 'Enter') {
        fn()
      }
    },
    [rerender]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [handleKeyDown, rerender])
}
