import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { selectReducer } from '../store.utils';
import { communitiesAdapter } from './communities.adapter';

export const selectById = (id: string) =>
  createSelector(selectReducer(StoreKeys.Communities), (reducerState) =>
    communitiesAdapter.getSelectors().selectById(reducerState, id)
  );

export const communitiesSelectors = {
  selectById,
};