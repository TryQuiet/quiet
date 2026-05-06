import { User } from '@quiet/types'

export interface UsernameRegistrationProps {
  registerUsernameAction: (username: string) => void
  registerUsernameError?: string | undefined
  usernameRegistered: boolean
  fetching?: boolean
  currentUsername?: string
  variant?: UsernameVariant
  registeredUsers?: Record<string, User>
  handleBackButton?: () => void
}

export enum UsernameVariant {
  NEW = 'new',
  TAKEN = 'taken',
}
