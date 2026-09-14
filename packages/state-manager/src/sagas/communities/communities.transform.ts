import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { type CommunitiesState } from './communities.slice'

export const CommunitiesTransform = createTransform(
  // inbound: before the slice is written to storage
  (inboundState: CommunitiesState) => {
    // strip transient onboarding and admission recovery state so a restart can resume a healthy pending invite
    const { invitationCodes, tosRequested, captchaRequested, admissionResetStatus, joinCommunityError, ...rest } =
      inboundState
    return rest as CommunitiesState
  },
  // outbound: use whatever is in storage without modification
  (outboundState: CommunitiesState) => outboundState,
  { whitelist: [StoreKeys.Communities] }
)
