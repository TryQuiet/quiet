import { createSelector } from 'reselect'
import { ModalName } from './modals.types'
import { CreatedSelectors, StoreState } from '../store.types'
import { StoreKeys } from '../../store/store.keys'
import { ModalState, modalsReducer } from './modals.slice'

const ModalsSlice: CreatedSelectors<StoreState>[StoreKeys.Modals] = (state: StoreState) =>
  state[StoreKeys.Modals]

export const open = (modal: ModalName) =>
  createSelector(ModalsSlice, (reducerState: ReturnType<typeof modalsReducer>) => {
    const modalState: ModalState = reducerState[modal as keyof typeof modalsReducer]
    return modalState?.open
  })

export const props = (modal: ModalName) =>
  createSelector(ModalsSlice, (reducerState: ReturnType<typeof modalsReducer>) => {
    const modalState: ModalState = reducerState[modal as keyof typeof modalsReducer]
    return modalState?.args || {}
  })

export const modalsSelectors = {
  open,
  props
}
