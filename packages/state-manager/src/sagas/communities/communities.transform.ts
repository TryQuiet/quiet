import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { type CommunitiesState } from './communities.slice'

export const CommunitiesTransform = createTransform(
  // inbound: before the slice is written to storage
  (inboundState: CommunitiesState) => {
    // Pending onboarding survives a socket reconnect in memory, but invite secrets
    // and unfinished requests must not be persisted/replayed on a later app launch.
    const { invitationCodes, pendingJoin, tosRequested, captchaRequested, ...rest } = inboundState
    return rest as CommunitiesState
  },
  // outbound: use whatever is in storage without modification
  (outboundState: CommunitiesState) => outboundState,
  { whitelist: [StoreKeys.Communities] }
)
