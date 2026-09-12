export interface CreateCommunityProps {
  createCommunityAction: (name: string) => void
  handleBackButton?: () => void
  networkCreated: boolean
  ready?: boolean
}
