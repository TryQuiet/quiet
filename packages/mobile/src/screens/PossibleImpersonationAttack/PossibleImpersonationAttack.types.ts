import { PossibleImpersonationAttackRouteProps } from '../../route.params'

export interface PossibleImpersonationAttackScreenProps {
  route: PossibleImpersonationAttackRouteProps
}
export interface PossibleImpersonationAttackComponentProps {
  handleBackButton: () => void
  communityName: string
  leaveCommunity: () => void
}
