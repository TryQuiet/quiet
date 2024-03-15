import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { communitiesAdapter } from './communities.adapter'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { CertFieldsTypes, getCertFieldValue, parseCertificate } from '@quiet/identity'

// Workaround for "The inferred type of 'communitiesSelectors' cannot be named without a reference to
// 'packages/identity/node_modules/pkijs/build'. This is likely not portable. A type annotation is necessary."
// https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1270716220
import type {} from 'pkijs'

const communitiesSlice: CreatedSelectors[StoreKeys.Communities] = (state: StoreState) => state[StoreKeys.Communities]

export const selectById = (id: string) =>
  createSelector(communitiesSlice, reducerState =>
    communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
  )

export const selectEntities = createSelector(communitiesSlice, reducerState =>
  communitiesAdapter.getSelectors().selectEntities(reducerState.communities)
)

export const selectCommunities = createSelector(communitiesSlice, reducerState =>
  communitiesAdapter.getSelectors().selectAll(reducerState.communities)
)

export const currentCommunity = createSelector(communitiesSlice, selectEntities, (state, entities) => {
  return entities[state.currentCommunity]
})

export const currentCommunityId = createSelector(communitiesSlice, reducerState => {
  return reducerState.currentCommunity
})

export const peerList = createSelector(currentCommunity, currentCommunity => {
  return currentCommunity?.peerList
})

export const invitationCodes = createSelector(communitiesSlice, reducerState => {
  return reducerState.invitationCodes
})

export const psk = createSelector(communitiesSlice, reducerState => {
  return reducerState.psk
})

export const ownerCertificate = createSelector(currentCommunity, currentCommunity => {
  return currentCommunity?.ownerCertificate
})

export const ownerOrbitDbIdentity = createSelector(currentCommunity, currentCommunity => {
  return currentCommunity?.ownerOrbitDbIdentity
})

export const ownerNickname = createSelector(ownerCertificate, ownerCertificate => {
  if (!ownerCertificate) return undefined

  const certificate = ownerCertificate
  const parsedCert = parseCertificate(certificate)
  const nickname = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)

  if (!nickname) {
    console.error('Could not retrieve owner nickname from certificate')
  }

  return nickname
})

export const communitiesSelectors = {
  selectById,
  selectEntities,
  selectCommunities,
  currentCommunity,
  currentCommunityId,
  invitationCodes,
  ownerOrbitDbIdentity,
  ownerCertificate,
  ownerNickname,
  psk,
  peerList,
}
