import { InvitationData } from '@quiet/types'

export interface JoinCommunityProps {
  joinCommunityAction: (address: InvitationData) => void
  redirectionAction: () => void
  networkCreated: boolean
  invitationCode?: string
  ready?: boolean
}
