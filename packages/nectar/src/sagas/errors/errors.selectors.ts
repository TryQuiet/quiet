import { createSelector } from 'reselect';
import { currentCommunityId } from '../communities/communities.selectors';
import { StoreKeys } from '../store.keys';
import { selectReducer } from '../store.utils';
import { errorAdapter, errorsAdapter } from './errors.adapter';
import { GENERAL_ERRORS } from './errors.slice';

export const currentCommunityErrors = createSelector(
  currentCommunityId, 
  selectReducer(StoreKeys.Errors), 
  (communityId: string, reducerState) => errorsAdapter.getSelectors().selectById(reducerState, communityId))

export const generalErrors = createSelector(
  selectReducer(StoreKeys.Errors), 
  (reducerState) => errorsAdapter.getSelectors().selectById(reducerState, GENERAL_ERRORS)
)

export const currentCommunityErrorByType = (type: string) => createSelector(
  currentCommunityErrors,
  (reducerState) => errorAdapter.getSelectors().selectById(reducerState.errors, type)
)

export const errorsSelectors = {
  currentCommunityErrors,
  currentCommunityErrorByType,
  generalErrors
};
