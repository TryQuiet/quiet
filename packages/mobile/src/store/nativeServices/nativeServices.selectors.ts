import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const nativeServicesSlice: CreatedSelectors[StoreKeys.NativeServices] = (state: StoreState) =>
  state[StoreKeys.NativeServices]

export const shouldClearReduxStore = () =>
  createSelector(nativeServicesSlice, reducerState => {
    return reducerState.shouldClearReduxStore
  })

export const nativeServicesSelectors = {
  shouldClearReduxStore,
}
