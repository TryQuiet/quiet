import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { communitiesAdapter } from './communities.adapter';
import { CreatedSelectors, StoreState } from '../store.types';

const communitiesSlice: CreatedSelectors[StoreKeys.Communities] = (state: StoreState) => state[StoreKeys.Communities]

export const selectById = (id: string) =>
  createSelector(communitiesSlice, (reducerState) =>
    communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
  );

export const currentCommunity = createSelector(
  communitiesSlice,
  (reducerState) => {
    const id = reducerState.currentCommunity;
    console.log('communitnies', reducerState.communities);
    return communitiesAdapter
      .getSelectors()
      .selectById(reducerState.communities, id);
  }
);

export const currentCommunityId = createSelector(
  communitiesSlice,
  (reducerState) => reducerState.currentCommunity
);

export const communitiesSelectors = {
  selectById,
  currentCommunityId,
  currentCommunity,
};
