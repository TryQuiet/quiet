import { StoreKeys } from '../store.keys'
import { createSelector } from '@reduxjs/toolkit'
import { identityAdapter } from './identity.adapter'
import { CreatedSelectors, StoreState } from '../store.types'
import { allCommunities, communitiesSelectors, _allCommunities } from '../communities/communities.selectors';

const identitySlice: CreatedSelectors[StoreKeys.Identity] = (
  state: StoreState
) => state[StoreKeys.Identity]

export const selectById = (id: string) =>
  createSelector(identitySlice, (reducerState) =>
    identityAdapter.getSelectors().selectById(reducerState.identities, id)
  )

export const selectEntities = createSelector(identitySlice, (reducerState) =>
  identityAdapter.getSelectors().selectEntities(reducerState.identities)
)

export const currentIdentity = createSelector(
  communitiesSelectors.currentCommunityId,
  identitySlice,
  (currentCommunityId, reducerState) => {
    return identityAdapter
      .getSelectors()
      .selectById(reducerState.identities, currentCommunityId)
  }
)

export const joinedCommunities = createSelector(
  allCommunities,
  identitySlice,
  (allCommunities, reducerState) => {
    return allCommunities.filter((community) => {
      const identityFromCommunity = identityAdapter
        .getSelectors()
        .selectById(reducerState.identities, community.id)
      return identityFromCommunity && identityFromCommunity.userCertificate
    })
  }
);

export const unregisteredCommunities = createSelector(
  allCommunities,
  identitySlice,
  (allCommunities, reducerState) => {
    return allCommunities.filter((community) => {
      const identityFromCommunity = identityAdapter
        .getSelectors()
        .selectById(reducerState.identities, community.id)
      return !identityFromCommunity?.userCertificate && identityFromCommunity
    })
  }
);

export const unregisteredCommunitiesWithoutUserIdentity = createSelector(
  allCommunities,
  identitySlice,
  (allCommunities, reducerState) => {
    return allCommunities.filter((community) => {
      const identityFromCommunity = identityAdapter
        .getSelectors()
        .selectById(reducerState.identities, community.id)
      return !identityFromCommunity
    })
  }
);


export const identitySelectors = {
  selectById,
  selectEntities,
  currentIdentity,
  joinedCommunities,
  unregisteredCommunities,
  unregisteredCommunitiesWithoutUserIdentity
}
