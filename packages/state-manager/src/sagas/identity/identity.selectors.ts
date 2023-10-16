import { StoreKeys } from '../store.keys'
import { createSelector } from '@reduxjs/toolkit'
import { identityAdapter } from './identity.adapter'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { communitiesSelectors, selectCommunities, currentCommunity } from '../communities/communities.selectors'
import { certificatesMapping } from '../users/users.selectors'

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

export const communityMembership = createSelector(currentIdentity, currentCommunity, (identity, community) => {
  return Boolean(identity?.userCsr && community?.name)
})

export const hasCertificate = createSelector(currentIdentity, identity => {
  return Boolean(identity?.userCertificate)
})

export const joinedCommunities = createSelector(selectCommunities, selectEntities, (communities, identities) => {
  return communities.filter(community => {
    return identities[community.id]?.userCertificate
  })
})

export const joinTimestamp = createSelector(currentIdentity, identity => identity?.joinTimestamp)

export const csr = createSelector(communitiesSelectors.currentCommunityId, selectEntities, (id, identities) => {
  return identities[id]?.userCsr
})

export const usernameTaken = createSelector(currentIdentity, certificatesMapping, (identity, certs) => {
  const userCertificate = identity?.userCertificate
  if (userCertificate) return false

  const username = identity?.nickname
  if (!username) return false

  const allUsersSet = new Set(Object.values(certs).map(user => user.username))
  if (allUsersSet.has(username)) {
    return true
  }

  return false
})

export const identitySelectors = {
  selectById,
  selectEntities,
  currentIdentity,
  communityMembership,
  joinedCommunities,
  joinTimestamp,
  csr,
  usernameTaken,
  hasCertificate,
}
