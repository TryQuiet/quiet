import { createSelector } from 'reselect';
import { currentCommunityId } from '../communities/communities.selectors';
import { StoreKeys } from '../store.keys';
import { CreatedSelectors, StoreState } from '../store.types';
import { errorsAdapter } from './errors.adapter';
import { GENERAL_ERRORS } from './errors.slice';

const errorSlice: CreatedSelectors[StoreKeys.Errors] = (state: StoreState) =>
  state[StoreKeys.Errors];

export const generalErrors = createSelector(errorSlice, (reducerState) =>
  errorsAdapter.getSelectors().selectAll(reducerState[GENERAL_ERRORS])
);

export const currentCommunityErrors = createSelector(
  currentCommunityId,
  errorSlice,
  (communityId: string, reducerState) => {
    if (communityId && reducerState[communityId]) {
      return errorsAdapter.getSelectors().selectAll(reducerState[communityId]);
    } else {
      return null;
    }
  }
);

export const currentCommunityErrorsByType = createSelector(
  currentCommunityId,
  errorSlice,
  (communityId: string, reducerState) => {
    if (communityId && reducerState[communityId]) {
      return errorsAdapter
        .getSelectors()
        .selectEntities(reducerState[communityId]);
    } else {
      return null;
    }
  }
);

export const errorsSelectors = {
  currentCommunityErrors,
  currentCommunityErrorsByType,
  generalErrors,
};
