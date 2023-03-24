import { createSelector } from 'reselect'
import { MenuName } from '../../const/MenuNames.enum'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const navigationSlice: CreatedSelectors[StoreKeys.Navigation] = (state: StoreState) =>
  state[StoreKeys.Navigation]

export const currentScreen = createSelector(
  navigationSlice,
  reducerState => reducerState.currentScreen
)

export const contextMenuVisibility = (menu: MenuName) =>
  createSelector(navigationSlice, reducerState => {
    return reducerState[menu]?.open
  })

export const contextMenuProps = (menu: MenuName) =>
  createSelector(navigationSlice, reducerState => {
    return reducerState[menu]?.args || {}
  })

export const navigationSelectors = {
  currentScreen,
  contextMenuVisibility,
  contextMenuProps
}
