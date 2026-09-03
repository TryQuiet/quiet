export type MemberSearchOptions = {
  includeRemoved: boolean
  throwOnMissing: boolean
}

export const DEFAULT_SEARCH_OPTIONS: MemberSearchOptions = { includeRemoved: false, throwOnMissing: true }

export type CreateUserInput = {
  name?: string
}

export type CreateUserFromInviteSeedInput = CreateUserInput & {
  seed: string
}

export const RANDOM_USERNAME_LENGTH = 32
