export interface UsernameRegistrationProps {
  registerUsernameAction: (username: string) => void
  registerUsernameError?: string | undefined
  usernameRegistered: boolean
}
