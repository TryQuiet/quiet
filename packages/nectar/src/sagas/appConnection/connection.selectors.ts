import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { CreatedSelectors, StoreState } from '../store.types';

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (
  state: StoreState
) => state[StoreKeys.Connection];

export const initializedCommunities = createSelector(
  connectionSlice,
  (reducerState) => reducerState.initializedCommunities
);

export const initializedRegistrars = createSelector(
  connectionSlice,
  (reducerState) => reducerState.initializedRegistrars
);

export const connectionSelectors = {
  initializedCommunities,
  initializedRegistrars,
};
