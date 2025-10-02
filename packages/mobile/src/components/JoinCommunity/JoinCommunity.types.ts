import { InvitationData } from '@quiet/types'

export interface JoinCommunityProps {
  joinCommunityAction: (address: InvitationData) => void
  redirectionAction: () => void
  hasReceivedResponse: boolean
  invitationCode?: string
  ready?: boolean
}
