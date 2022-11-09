import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const navigationSlice: CreatedSelectors[StoreKeys.Navigation] = (state: StoreState) =>
  state[StoreKeys.Navigation]

export const currentScreen = createSelector(
    navigationSlice,
    (reducerState) =>
        reducerState.currentScreen
)

export const navigationSelectors = {
    currentScreen
}
