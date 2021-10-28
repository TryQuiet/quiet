import { StoreKeys } from '../store.keys';
import { createSelector } from '@reduxjs/toolkit';
import { identityAdapter } from './identity.adapter';
import { CreatedSelectors, StoreState } from '../store.types';
import { communitiesSelectors } from '../communities/communities.selectors';

const identitySlice: CreatedSelectors[StoreKeys.Identity] = (
  state: StoreState
) => state[StoreKeys.Identity];

export const selectById = (id: string) =>
  createSelector(identitySlice, (reducerState) =>
    identityAdapter.getSelectors().selectById(reducerState.identities, id)
  );

export const currentIdentity = createSelector(
  communitiesSelectors.currentCommunityId,
  identitySlice,
  (currentCommunityId, reducerState) => {
    return identityAdapter
      .getSelectors()
      .selectById(reducerState.identities, currentCommunityId);
  }
);

export const identitySelectors = {
  selectById,
  currentIdentity,
};
