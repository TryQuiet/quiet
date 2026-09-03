import { Keyset, LocalUserContext, ProofOfInvitation } from '@localfirst/auth'

export type MemberSearchOptions = {
  includeRemoved: boolean
  throwOnMissing: boolean
}

export type ProspectiveUser = {
  context: LocalUserContext
  inviteProof: ProofOfInvitation
  publicKeys: Keyset
}

export const DEFAULT_SEARCH_OPTIONS: MemberSearchOptions = { includeRemoved: false, throwOnMissing: true }

export type CreateUserInput = {
  name?: string
  id?: string
}

export type CreateUserFromInviteSeedInput = CreateUserInput & {
  seed: string
}

export type CreateDeviceFromInviteSeedInput = {
  seed: string
  userName: string
  deviceName?: string
  expectedTeamId: string
  expectedUserId: string
}

export const RANDOM_USERNAME_LENGTH = 32
