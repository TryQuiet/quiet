import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { communitiesAdapter } from './communities.adapter';
import { CreatedSelectors, StoreState } from '../store.types';
import logger from '../../utils/logger'
const log = logger('communities')

const communitiesSlice: CreatedSelectors[StoreKeys.Communities] = (
  state: StoreState
) => state[StoreKeys.Communities];

export const selectById = (id: string) =>
  createSelector(communitiesSlice, (reducerState) =>
    communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
  );

export const allCommunities = createSelector(
  communitiesSlice,
  (reducerState) => {
    return communitiesAdapter
      .getSelectors()
      .selectAll(reducerState.communities);
  }
);

export const ownCommunities = createSelector(allCommunities, (communities) => {
  return communities?.filter((community) => community.CA !== null) || []
});

export const currentCommunity = createSelector(
  communitiesSlice,
  (reducerState) => {
    log(`current community ${reducerState.currentCommunity}`)
    const id = reducerState.currentCommunity;
    return communitiesAdapter
      .getSelectors()
      .selectById(reducerState.communities, id);
  }
);

export const currentCommunityId = createSelector(
  communitiesSlice,
  (reducerState) => {
    log('current community id', reducerState.currentCommunity)
    return reducerState.currentCommunity
  }
);

export const registrarUrl = createSelector(currentCommunity, (community) => {
  let registrarAddress: string = '';
  if (community.onionAddress) {
    registrarAddress = community.port ? `${community.onionAddress}:${community.port}` : `${community.onionAddress}`;
  } else if (community.registrarUrl) {
    registrarAddress = community.registrarUrl
  }
  return registrarAddress;
});

export const isOwner = createSelector(currentCommunity, (community) => {
  return community && community.CA !== null;
});

export const communitiesSelectors = {
  selectById,
  allCommunities,
  ownCommunities,
  currentCommunityId,
  currentCommunity,
  registrarUrl,
  isOwner,
};
