import { Member, Role } from '@localfirst/auth'
import { EncryptionScopeType, type EncryptionScope } from '../crypto/types'

export enum RoleName {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export const MEMBER_SCOPE: EncryptionScope = {
  name: RoleName.MEMBER,
  type: EncryptionScopeType.ROLE,
}

export const PUBLIC_CHANNEL_MODIFICATION_ROLES = [RoleName.ADMIN]

export const SELF_ASSIGN_ROLES: (RoleName | string)[] = [RoleName.MEMBER]

export type RoleMemberInfo = {
  id: string
  name: string
}

export type BaseQuietRole = Role & {
  hasRole?: boolean
}

export type QuietRole = BaseQuietRole & {
  members: Member[]
}

export type TruncatedQuietRole = BaseQuietRole & {
  members: RoleMemberInfo[]
}

export type BaseChannel = {
  channelName: string
}

export type Channel = QuietRole & BaseChannel

export type TruncatedChannel = TruncatedQuietRole & BaseChannel

export class NotAdminError extends Error {
  constructor() {
    super('User is not an admin on this community')
  }
}
