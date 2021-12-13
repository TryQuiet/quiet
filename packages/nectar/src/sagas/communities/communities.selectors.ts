import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { communitiesAdapter } from './communities.adapter';
import { CreatedSelectors, StoreState } from '../store.types';

const communitiesSlice: CreatedSelectors[StoreKeys.Communities] = (
  state: StoreState
) => state[StoreKeys.Communities];

export const selectById = (id: string) =>
  createSelector(communitiesSlice, (reducerState) =>
    communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
  );

export const selectEntities = createSelector(communitiesSlice, (reducerState) =>
  communitiesAdapter.getSelectors().selectEntities(reducerState.communities)
);

export const _allCommunities = createSelector(
  communitiesSlice,
  (reducerState) => {
    return communitiesAdapter
      .getSelectors()
      .selectEntities(reducerState.communities);
  }
);

export const allCommunities = createSelector(
  _allCommunities,
  (communities) => {
    return Object.values(communities)
  }
);

export const ownCommunities = createSelector(_allCommunities, (communities) => {
  return (
    Object.values(communities).filter((community) => community.CA !== null) ||
    []
  );
});

export const currentCommunity = createSelector(
  communitiesSlice,
  (reducerState) => {
    const id = reducerState.currentCommunity;
    return communitiesAdapter
      .getSelectors()
      .selectById(reducerState.communities, id);
  }
);

export const communityById = (communityId: string) =>
  createSelector(communitiesSlice, (reducerState) => {
    return communitiesAdapter
      .getSelectors()
      .selectById(reducerState.communities, communityId);
  });

export const currentCommunityId = createSelector(
  communitiesSlice,
  (reducerState) => {
    return reducerState.currentCommunity;
  }
);

export const registrarUrl = (communityId: string) =>
  createSelector(_allCommunities, (communities) => {
    const community = communities[communityId];
    let registrarAddress: string = '';
    if (!community) {
      return;
    }
    if (community.onionAddress) {
      registrarAddress = community.port
        ? `${community.onionAddress}:${community.port}`
        : `${community.onionAddress}`;
    } else if (community.registrarUrl) {
      registrarAddress = community.registrarUrl;
    }
    return registrarAddress;
  });

export const isOwner = createSelector(currentCommunity, (community) => {
  return community && community.CA !== null;
});

export const communitiesSelectors = {
  selectById,
  selectEntities,
  allCommunities,
  ownCommunities,
  currentCommunityId,
  currentCommunity,
  registrarUrl,
  isOwner,
};
