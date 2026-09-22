import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { communitiesAdapter } from './communities.adapter'
import { type CreatedSelectors, type StoreState } from '../store.types'

// Workaround for "The inferred type of 'communitiesSelectors' cannot be named without a reference to
// 'packages/identity/node_modules/pkijs/build'. This is likely not portable. A type annotation is necessary."
// https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1270716220
import type {} from 'pkijs'
import { createLogger } from '../../utils/logger'
import { CommunityOwnership, InvitationDataVersion, type InvitationData } from '@quiet/types'

const logger = createLogger('communitiesSelectors')

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

export const invitationCodes = createSelector(communitiesSlice, reducerState => {
  return reducerState.invitationCodes
})

export const pendingJoin = createSelector(communitiesSlice, reducerState => reducerState.pendingJoin ?? null)

export const pendingCreate = createSelector(communitiesSlice, reducerState => reducerState.pendingCreate ?? null)

/**
 * Whether an invite is to a community hosted on a server (QSS). v5 is the QSS
 * invite version; older versions are Tor-only. Shared with joinCommunitySaga,
 * which gates the terms of service on the same question.
 */
export const inviteUsesServer = (invite: InvitationData | null | undefined): boolean =>
  invite?.version === InvitationDataVersion.v5 && Boolean(invite.qssEnabled || invite.qssEndpoint)

/**
 * Whether the community in play reaches its peers through a server (QSS) rather
 * than over Tor alone. The progress screens branch on it, and each stage of the
 * flow knows it from a different place:
 *
 * - joining: the invite, before any community record exists;
 * - creating: the owner's own answer, before the backend has replied;
 * - afterwards: the community record the backend handed back.
 */
export const usesServer = createSelector(pendingJoin, pendingCreate, currentCommunity, (join, creating, community) => {
  if (join) return inviteUsesServer(join.inviteData)
  if (creating) return creating.useServer
  return community?.qssEnabled === true
})

/**
 * What the progress screen should call the community, and whether the person
 * waiting is its owner. Both are on the community record, and the record is the
 * last thing to arrive: an owner watches the whole of creation before it
 * exists. The pending create carries the name they typed and says, by existing
 * at all, that they are creating rather than joining.
 */
export const communityInProgress = createSelector(pendingCreate, currentCommunity, (creating, community) => ({
  name: creating?.name ?? community?.name,
  isOwner: creating !== null || community?.ownership === CommunityOwnership.Owner,
}))

export const inviteData = createSelector(currentCommunity, currentCommunity => {
  return currentCommunity?.inviteData
})

export const psk = createSelector(currentCommunity, currentCommunity => {
  return currentCommunity?.psk
})

export const ownerOrbitDbIdentity = createSelector(currentCommunity, currentCommunity => {
  return currentCommunity?.ownerOrbitDbIdentity
})

export const isOwner = createSelector(currentCommunity, currentCommunity => {
  return Boolean(currentCommunity?.ownership === CommunityOwnership.Owner)
})

export const tosRequested = createSelector(communitiesSlice, reducerState => {
  return reducerState.tosRequested
})

export const joinCommunityError = createSelector(communitiesSlice, reducerState => reducerState.joinCommunityError)

export const communitiesSelectors = {
  admissionResetStatus: createSelector(communitiesSlice, state => state.admissionResetStatus ?? 'idle'),
  admissionResetResult: createSelector(communitiesSlice, state => state.admissionResetResult ?? null),
  selectById,
  selectEntities,
  selectCommunities,
  currentCommunity,
  currentCommunityId,
  invitationCodes,
  pendingJoin,
  pendingCreate,
  usesServer,
  communityInProgress,
  inviteData,
  ownerOrbitDbIdentity,
  psk,
  isOwner,
  tosRequested,
  joinCommunityError,
}
