export interface JoinCommunityProps {
  joinCommunityAction: (address: string) => void
  redirectionAction: () => void
  invitationCode?: string
}
