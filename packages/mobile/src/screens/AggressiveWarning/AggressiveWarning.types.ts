import { AggressiveWarningRouteProps } from '../../route.params'

export interface AggressiveWarningScreenProps {
  route: AggressiveWarningRouteProps
}
export interface AggressiveWarningComponentProps {
  handleBackButton: () => void
  communityName: string
  leaveCommunity: () => void
}
