import { InvitationData } from '@quiet/types'
import type { PasteInviteLinkVariant } from '../../route.params'

export interface JoinCommunityProps {
  joinCommunityAction: (data: InvitationData) => void
  handleBackButton?: () => void
  invitationCode?: string
  hasReceivedResponse: boolean
  variant?: PasteInviteLinkVariant
  ready?: boolean
}
