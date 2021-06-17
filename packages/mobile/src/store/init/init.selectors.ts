import { createSelector } from 'reselect';
import { StoreKeys } from '../store.keys';
import { StoreState } from '../store.types';
import { selectReducer } from '../store.utils';
import { initChecksAdapter } from './init.adapter';

export const isRestored = createSelector(
  selectReducer(StoreKeys.Init),
  (reducerState: StoreState[StoreKeys.Init]) => reducerState.isRestored,
);

export const initChecks = createSelector(
  selectReducer(StoreKeys.Init),
  (reducerState: StoreState[StoreKeys.Init]) =>
    initChecksAdapter.getSelectors().selectAll(reducerState.initChecks),
);

export const initSelectors = { isRestored, initChecks };
