import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { selectReducer } from '../store.utils';
import { communitiesAdapter } from './communities.adapter';

export const selectById = (id: string) =>
  createSelector(selectReducer(StoreKeys.Communities), (reducerState) =>
    communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
  );

export const currentCommunity = createSelector(
  selectReducer(StoreKeys.Communities),
  (reducerState) => {
    const id = reducerState.currentCommunity;
    console.log('communitnies', reducerState.communities);
    return communitiesAdapter
      .getSelectors()
      .selectById(reducerState.communities, id);
  }
);

export const currentCommunityId = createSelector(
  selectReducer(StoreKeys.Communities),
  (reducerState) => reducerState.currentCommunity
);

export const communitiesSelectors = {
  selectById,
  currentCommunityId,
  currentCommunity,
};
