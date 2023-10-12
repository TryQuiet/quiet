import { InvitationPair } from '@quiet/types'

export interface JoinCommunityProps {
  joinCommunityAction: (address: { pairs: InvitationPair[]; psk: string }) => void
  redirectionAction: () => void
  networkCreated: boolean
  invitationCode?: string
  ready?: boolean
}
