import { jest } from '@jest/globals'
import { RoleName } from '../auth/services/roles/roles'
import { grantMissingMemberRoleFromConnectedPeer } from './memberRoleGrant'

describe('connected peer member-role fallback', () => {
  const peerWithoutMemberRole = { userId: 'charlie', roles: [] } as any

  it('never lets a non-admin admitter grant the peer member role from stale connection context', () => {
    const addMember = jest.fn()

    expect(
      grantMissingMemberRoleFromConnectedPeer(
        {
          amIAdmin: () => false,
          addMember,
        },
        peerWithoutMemberRole
      )
    ).toBe(false)
    expect(addMember).not.toHaveBeenCalled()
  })

  it('retains the administrator fallback for a genuinely missing peer role', () => {
    const addMember = jest.fn()

    expect(
      grantMissingMemberRoleFromConnectedPeer(
        {
          amIAdmin: () => true,
          addMember,
        },
        peerWithoutMemberRole
      )
    ).toBe(true)
    expect(addMember).toHaveBeenCalledWith('charlie', RoleName.MEMBER)
  })

  it('does not duplicate a role already visible in the connection context', () => {
    const addMember = jest.fn()

    expect(
      grantMissingMemberRoleFromConnectedPeer(
        {
          amIAdmin: () => true,
          addMember,
        },
        { userId: 'charlie', roles: [RoleName.MEMBER] } as any
      )
    ).toBe(false)
    expect(addMember).not.toHaveBeenCalled()
  })
})
