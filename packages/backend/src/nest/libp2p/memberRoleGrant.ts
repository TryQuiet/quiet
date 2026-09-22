import { RoleName } from '../auth/services/roles/roles'

interface MemberRoleManager {
  amIAdmin: () => boolean
  addMember: (memberId: string, roleName: RoleName | string) => void
}

interface ConnectedPeerMember {
  userId: string
  roles: string[]
}

export const grantMissingMemberRoleFromConnectedPeer = (
  roles: MemberRoleManager,
  peer: ConnectedPeerMember | undefined
): boolean => {
  if (peer == null || peer.roles.includes(RoleName.MEMBER) || !roles.amIAdmin()) {
    return false
  }
  roles.addMember(peer.userId, RoleName.MEMBER)
  return true
}
