import { UnregisteredUsernameRouteProps } from '../../route.params'

export interface UnregisteredUsernameScreenProps {
  route: UnregisteredUsernameRouteProps
}

export interface UnregisteredUsernameComponentProps {
  handleBackButton: () => void
  username: string
}
