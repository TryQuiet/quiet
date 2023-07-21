import { StoreKeys } from '../store.keys'
import { createSelector } from '@reduxjs/toolkit'
import { identityAdapter } from './identity.adapter'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { communitiesSelectors, selectCommunities } from '../communities/communities.selectors'

const identitySlice: CreatedSelectors[StoreKeys.Identity] = (state: StoreState) => state[StoreKeys.Identity]

export const selectById = (id: string) =>
  createSelector(identitySlice, reducerState => identityAdapter.getSelectors().selectById(reducerState.identities, id))

export const selectEntities = createSelector(identitySlice, reducerState =>
  identityAdapter.getSelectors().selectEntities(reducerState.identities)
)

export const currentIdentity = createSelector(
  communitiesSelectors.currentCommunityId,
  identitySlice,
  (currentCommunityId, reducerState) => {
    return identityAdapter.getSelectors().selectById(reducerState.identities, currentCommunityId)
  }
)

export const communityMembership = createSelector(
  currentIdentity,
  identity => {
    return Boolean(identity?.userCertificate)
  }
)

export const joinedCommunities = createSelector(selectCommunities, selectEntities, (communities, identities) => {
  return communities.filter(community => {
    return identities[community.id]?.userCertificate
  })
})

export const joinTimestamp = createSelector(currentIdentity, identity => identity?.joinTimestamp)

export const identitySelectors = {
  selectById,
  selectEntities,
  currentIdentity,
  communityMembership,
  joinedCommunities,
  joinTimestamp,
}
