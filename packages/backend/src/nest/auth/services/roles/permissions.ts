import { PermissionsMap, Permission } from '@localfirst/auth'

export const defaultDmPermissions = (memberIds: string[]): PermissionsMap => {
  return {
    [Permission.MODIFIABLE_MEMBERSHIP]: {
      memberIds,
    },
  }
}

export const defaultChannelPermissions = (): PermissionsMap => {
  return {
    [Permission.MODIFIABLE_MEMBERSHIP]: true,
  }
}

export const defaultGenericPermissions = (): PermissionsMap => {
  return {
    [Permission.MODIFIABLE_MEMBERSHIP]: true,
  }
}
