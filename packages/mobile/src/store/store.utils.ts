import {createSelector} from '@reduxjs/toolkit';

import {AnyObject} from '../utils/types/AnyObject.interface';
import {StoreKeys} from './store.keys';
import {
  CreatedSelectors,
  StoreModuleStateClass,
  StoreState,
} from './store.types';

export const selectorsFactory = <StoreKey extends StoreKeys>(
  storeKey: StoreKey,
  ReducerState: StoreModuleStateClass,
): CreatedSelectors<StoreState[StoreKey]> => {
  const reducerSelector = (store: AnyObject): StoreState[StoreKey] =>
    store[storeKey] as StoreState[StoreKey];
  const reducerKeys = Object.keys(
    new ReducerState(),
  ) as (keyof StoreState[StoreKey])[];
  const createdSelectors = {} as CreatedSelectors<StoreState[StoreKey]>;

  return reducerKeys.reduce(
    (
      accumulator: CreatedSelectors<StoreState[StoreKey]>,
      key: keyof StoreState[StoreKey],
    ): CreatedSelectors<StoreState[StoreKey]> => {
      accumulator[key] = createSelector(
        reducerSelector,
        (state: StoreState[StoreKey]) => state[key],
      );

      return accumulator;
    },
    createdSelectors,
  );
};

export const selectReducer = <StoreKey extends StoreKeys>(
  storeKey: StoreKey,
) => {
  return (store: StoreState): StoreState[StoreKey] => {
    return store[storeKey];
  };
};
