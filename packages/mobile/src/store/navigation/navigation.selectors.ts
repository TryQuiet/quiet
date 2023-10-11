import { createSelector } from 'reselect'
import { MenuName } from '../../const/MenuNames.enum'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const navigationSlice: CreatedSelectors[StoreKeys.Navigation] = (state: StoreState) => state[StoreKeys.Navigation]

export const currentScreen = createSelector(navigationSlice, reducerState => reducerState.backStack.slice(-1)[0])

export const contextMenuVisibility = (menu: MenuName) =>
  createSelector(navigationSlice, reducerState => {
    return reducerState[menu]?.open
  })

export const contextMenuProps = (menu: MenuName) =>
  createSelector(navigationSlice, reducerState => {
    return reducerState[menu]?.args || {}
  })

export const confirmationBox = () =>
  createSelector(navigationSlice, reducerState => {
    return reducerState.confirmationBox
  })

export const pendingNavigation = createSelector(navigationSlice, reducerState => reducerState.pendingNavigation)

export const navigationSelectors = {
  currentScreen,
  contextMenuVisibility,
  contextMenuProps,
  confirmationBox,
  pendingNavigation,
}
