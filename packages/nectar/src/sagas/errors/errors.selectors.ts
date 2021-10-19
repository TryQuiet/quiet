import { createSelector } from 'reselect';
import { currentCommunityId } from '../communities/communities.selectors';
import { StoreKeys } from '../store.keys';
import { CreatedSelectors, StoreState } from '../store.types';
import { errorAdapter, errorsAdapter } from './errors.adapter';
import { GENERAL_ERRORS } from './errors.slice';

const errorSlice: CreatedSelectors[StoreKeys.Errors] = (state: StoreState) =>
  state[StoreKeys.Errors];

export const currentCommunityErrors = createSelector(
  currentCommunityId,
  errorSlice,
  (communityId: string, reducerState) =>
    errorsAdapter.getSelectors().selectById(reducerState, communityId)
);

export const generalErrors = createSelector(errorSlice, (reducerState) =>
  errorsAdapter.getSelectors().selectById(reducerState, GENERAL_ERRORS)
);

export const currentCommunityErrorByType = (type: string) =>
  createSelector(currentCommunityErrors, (reducerState) =>
    errorAdapter.getSelectors().selectById(reducerState.errors, type)
  );

export const errorsSelectors = {
  currentCommunityErrors,
  currentCommunityErrorByType,
  generalErrors,
};
