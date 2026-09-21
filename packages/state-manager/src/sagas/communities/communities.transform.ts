import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { type CommunitiesState } from './communities.slice'

const removeInvitationData = (state: CommunitiesState): CommunitiesState => {
  const { invitationCodes: _invitationCodes, ...safeState } = state
  return {
    ...safeState,
    communities: {
      ...state.communities,
      entities: Object.fromEntries(
        Object.entries(state.communities.entities).map(([id, community]) => {
          if (community == null) return [id, community]
          const { inviteData: _inviteData, ...safeCommunity } = community
          return [id, safeCommunity]
        })
      ),
    },
  } as CommunitiesState
}

export const CommunitiesTransform = createTransform(
  // inbound: before the slice is written to storage
  (inboundState: CommunitiesState) => {
    // Pending onboarding survives a socket reconnect in memory, but invite secrets
    // and unfinished requests must not be persisted/replayed on a later app launch.
    const {
      invitationCodes,
      pendingJoin,
      tosRequested,
      captchaRequested,
      admissionResetStatus,
      admissionResetResult,
      joinCommunityError,
      ...rest
    } = inboundState
    return removeInvitationData(rest as CommunitiesState)
  },
  // Also scrub invitation data written by older application versions.
  (outboundState: CommunitiesState) => removeInvitationData(outboundState),
  { whitelist: [StoreKeys.Communities] }
)
