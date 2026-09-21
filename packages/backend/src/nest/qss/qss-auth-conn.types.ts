import type { InviteeContext, MemberContext, Team } from '@localfirst/auth'
import type { JoinStatus } from '../libp2p/libp2p.auth'

export interface PendingQssJoin {
  team: Team
  joiningNow: boolean
  needsMemberSelfAssign: boolean
  previousContext: MemberContext | InviteeContext
  onCommitted: () => void
  previousJoinStatus: JoinStatus
}
