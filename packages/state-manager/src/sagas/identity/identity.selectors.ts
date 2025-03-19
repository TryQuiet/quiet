import { StoreKeys } from '../store.keys'
import { createSelector } from '@reduxjs/toolkit'
import { identityAdapter } from './identity.adapter'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { communitiesSelectors, selectCommunities, currentCommunity } from '../communities/communities.selectors'
import { allUsers } from '../users/users.selectors'
import { createLibp2pAddress } from '@quiet/common'

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

export const currentPeerAddress = createSelector(currentIdentity, identity => {
  if (!identity) return ''
  return createLibp2pAddress(identity?.networkInfo.hiddenService.onionAddress, identity?.networkInfo.peerId.id)
})

export const communityMembership = createSelector(currentIdentity, currentCommunity, (identity, community) => {
  return Boolean(identity && community)
})

export const joinedCommunities = createSelector(selectCommunities, selectEntities, (communities, identities) => {
  // TODO: base on sigchains
  return communities.filter(community => {
    return identities[community.id]?.joinTimestamp
  })
})

export const joinTimestamp = createSelector(currentIdentity, identity => identity?.joinTimestamp)

export const usernameTaken = createSelector(currentIdentity, allUsers, (identity, users) => {
  const username = identity?.nickname
  if (!username) return false

  const allUsersSet = new Set(Object.values(users).map(user => user.username))
  if (allUsersSet.has(username)) {
    return true
  }

  return false
})

export const identitySelectors = {
  selectById,
  selectEntities,
  currentIdentity,
  currentPeerAddress,
  communityMembership,
  joinedCommunities,
  joinTimestamp,
  usernameTaken,
}
