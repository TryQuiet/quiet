import { StoreKeys } from '../store.keys'
import { createSelector } from '@reduxjs/toolkit'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { currentCommunity } from '../communities/communities.selectors'
import { certificatesMapping } from '../users/users.selectors'

const identitySlice: CreatedSelectors[StoreKeys.Identity] = (state: StoreState) => state[StoreKeys.Identity]

export const currentIdentity = createSelector(
  identitySlice,
  (reducerState) => {
    return reducerState.identity
  }
)

export const communityMembership = createSelector(currentIdentity, currentCommunity, (identity, community) => {
  return Boolean(identity?.userCsr && community?.name)
})

export const hasCertificate = createSelector(currentIdentity, identity => {
  return Boolean(identity?.userCertificate)
})

export const joinedCommunities = createSelector(currentIdentity, (identity) => {
  if (identity?.userCertificate) {
    return identity.id
  } else {
    return null
  }
})

export const joinTimestamp = createSelector(currentIdentity, identity => identity?.joinTimestamp)

export const csr = createSelector(currentIdentity, (identity) => {
  return identity.userCsr
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
  currentIdentity,
  communityMembership,
  joinedCommunities,
  joinTimestamp,
  csr,
  usernameTaken,
  hasCertificate,
}
