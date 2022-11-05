import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const navigationSlice: CreatedSelectors[StoreKeys.Navigation] = (state: StoreState) =>
  state[StoreKeys.Navigation]

export const navigationReady = createSelector(
  navigationSlice,
  (reducerState) =>
      reducerState.navigationReady
)

export const currentScreen = createSelector(
    navigationSlice,
    (reducerState) =>
        reducerState.currentScreen
)

export const navigationSelectors = {
    navigationReady,
    currentScreen
}
