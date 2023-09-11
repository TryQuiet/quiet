import { InvitationPair } from '@quiet/types'

export interface JoinCommunityProps {
  joinCommunityAction: (address: InvitationPair[]) => void
  redirectionAction: () => void
  networkCreated: boolean
  invitationCode?: string
  ready?: boolean
}
