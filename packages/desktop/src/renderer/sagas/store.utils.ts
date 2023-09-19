import { createSelector } from '@reduxjs/toolkit'
import { StoreKeys } from '../store/store.keys'
import { AnyObject } from '../../utils/types/AnyObject.interface'

import { CreatedSelectors, StoreModuleStateClass, StoreState } from './store.types'

export const selectorsFactory = <StoreKey extends StoreKeys>(
  storeKey: StoreKey,
  ReducerState: StoreModuleStateClass
): CreatedSelectors<StoreState[StoreKey]> => {
  const reducerSelector = (store: AnyObject): StoreState[StoreKey] => store[storeKey]
  const reducerKeys = Object.keys(new ReducerState()) as Array<keyof StoreState[StoreKey]>
  // @ts-expect-error
  const createdSelectors: CreatedSelectors<StoreState[StoreKey]> = {}

  return reducerKeys.reduce(
    (
      accumulator: CreatedSelectors<StoreState[StoreKey]>,
      key: keyof StoreState[StoreKey]
    ): CreatedSelectors<StoreState[StoreKey]> => {
      accumulator[key] = createSelector(reducerSelector, (state: StoreState[StoreKey]) => state[key])

      return accumulator
    },
    createdSelectors
  )
}

export const selectReducer = <StoreKey extends StoreKeys>(storeKey: StoreKey) => {
  return (store: StoreState): StoreState[StoreKey] => {
    return store[storeKey]
  }
}
