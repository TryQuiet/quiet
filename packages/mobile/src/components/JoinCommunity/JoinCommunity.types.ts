export interface JoinCommunityProps {
  joinCommunityAction: (address: string) => void
  redirectionAction: () => void
  networkCreated: boolean
  invitationCode?: string
  ready?: boolean
}
