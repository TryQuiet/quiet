import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from '..//roles/roles'
import { UserService } from '../members/user.service'
import { InviteService } from './invite.service'
import { DeviceService } from '../members/device.service'
import { base58 } from '@localfirst/crypto'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from '../members/types'
import { invitation } from '@localfirst/auth'

const logger = createLogger('auth:services:invite.spec')

describe('invites', () => {
  let adminSigChain: SigChain
  let newMemberSigChain: SigChain
  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create()
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.user).toBeDefined()
    expect(adminSigChain.teamName).toBeDefined()
    expect(base58.detect(adminSigChain.teamName!)).toBeTruthy()
    expect(adminSigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(base58.detect(adminSigChain.user.userName)).toBeTruthy()
    expect(adminSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('admin should generate an invite and it be added to team graph', () => {
    const newInvite = adminSigChain.invites.createUserInvite()
    expect(newInvite).toBeDefined()
    expect(adminSigChain.invites.getAllInvites().length).toBe(1)
    expect(adminSigChain.invites.getById(newInvite.id)).toBeDefined()
  })
  it('should identify a non-expiring member invite as long-lived', () => {
    const invite = adminSigChain.invites.createLongLivedUserInvite()
    const invitationState = adminSigChain.invites.getById(invite.id)

    expect(invitationState.kind).toBe('member')
    expect(invitationState.expiration).toBe(0)
    expect(invitationState.roleNames).toEqual([RoleName.MEMBER])
    const roleGrantKeys = invitation.generateRoleGrantKeys(invite.seed)
    expect(adminSigChain.team!.roleKeys(RoleName.MEMBER, undefined, roleGrantKeys)).toEqual(
      adminSigChain.team!.roleKeys(RoleName.MEMBER)
    )
    expect(adminSigChain.invites.isValidLongLivedUserInvite(invite.id)).toBe(true)
  })
  it('should let an admitted user self-assign MEMBER from a long-lived invite grant', () => {
    const invite = adminSigChain.invites.createLongLivedUserInvite()
    const prospectiveMember = UserService.createFromInviteSeed({ seed: invite.seed })
    const admission = InviteService.createMemberAdmission({
      seed: invite.seed,
      context: prospectiveMember,
    })

    // Model a QSS acceptor: admission supplies TEAM keys but does not author a role assignment.
    adminSigChain.invites.admitUser(admission)
    const admittedSigChain = SigChain.joinForTesting(
      prospectiveMember,
      adminSigChain.team!.save(),
      adminSigChain.team!.teamKeyring()
    )

    expect(admittedSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(false)
    admittedSigChain.roles.addSelf(RoleName.MEMBER, invite.seed, invite.salt)
    expect(admittedSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
    expect(admittedSigChain.team!.roleKeys(RoleName.MEMBER)).toEqual(adminSigChain.team!.roleKeys(RoleName.MEMBER))
  })
  it('should reject a legacy long-lived invite without a MEMBER grant', () => {
    const isolatedSigChain = SigChain.create()
    const legacyInvite = isolatedSigChain.team!.inviteMember()

    expect(isolatedSigChain.invites.isValidLongLivedUserInvite(legacyInvite.id)).toBe(false)
  })
  it('should preserve a long-lived invite when disabled membership removal is refused', () => {
    const isolatedSigChain = SigChain.create()
    const invite = isolatedSigChain.invites.createLongLivedUserInvite()
    expect(() => isolatedSigChain.roles.revokeMembership(isolatedSigChain.user.userId, RoleName.MEMBER)).toThrow(
      /removal and key rotation are disabled/i
    )

    expect(isolatedSigChain.invites.isValidLongLivedUserInvite(invite.id)).toBe(true)
  })
  it('admin should generate an invite seed and create a new user from it', () => {
    const invite = adminSigChain.invites.createUserInvite()
    expect(invite).toBeDefined()
    const prospectiveMember = UserService.createFromInviteSeed({ seed: invite.seed })
    const admission = InviteService.createMemberAdmission({ seed: invite.seed, context: prospectiveMember })
    expect(admission.proof).toBeDefined()
    expect(adminSigChain.invites.validateProof(admission.proof, admission.claim, admission.possessionProof)).toBe(true)
    expect(prospectiveMember).toBeDefined()
    expect(adminSigChain.invites.admitMemberFromInvite(admission)).toBeDefined()
    newMemberSigChain = SigChain.joinForTesting(
      prospectiveMember,
      adminSigChain.team!.save(),
      adminSigChain.team!.teamKeyring()
    )
    expect(newMemberSigChain).toBeDefined()
    expect(newMemberSigChain.user).toBeDefined()
    logger.info('adminSigChain.team', adminSigChain.team)
    expect(adminSigChain.team).toBeDefined()
    logger.info('newMemberSigChain.team', newMemberSigChain.team)
    expect(newMemberSigChain.team).toBeDefined()
    expect(base58.detect(newMemberSigChain.user.userName)).toBeTruthy()
    expect(newMemberSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
    expect(newMemberSigChain.user.userId).not.toBe(adminSigChain.user.userId)
    expect(newMemberSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
    expect(newMemberSigChain.roles.amIAdmin()).toBe(false)
    expect(adminSigChain.roles.memberHasRole(newMemberSigChain.user.userId, RoleName.MEMBER)).toBe(true)
  })
  it('admin should be able to revoke an invite', () => {
    const inviteToRevoke = adminSigChain.invites.createUserInvite()
    expect(inviteToRevoke).toBeDefined()
    adminSigChain.invites.revoke(inviteToRevoke.id)
    const prospectiveMember = UserService.createFromInviteSeed({ seed: inviteToRevoke.seed })
    const revokedAdmission = InviteService.createMemberAdmission({
      seed: inviteToRevoke.seed,
      context: prospectiveMember,
    })
    expect(revokedAdmission.proof).toBeDefined()
    expect(
      adminSigChain.invites.validateProof(
        revokedAdmission.proof,
        revokedAdmission.claim,
        revokedAdmission.possessionProof
      )
    ).toBe(false)
  })
  it('admitting a new member with an invalid invite should fail', () => {
    const prospectiveMember = UserService.createFromInviteSeed({ seed: 'invalidseed' })
    const invalidAdmission = InviteService.createMemberAdmission({
      seed: 'invalidseed',
      context: prospectiveMember,
    })
    expect(invalidAdmission.proof).toBeDefined()
    expect(
      adminSigChain.invites.validateProof(
        invalidAdmission.proof,
        invalidAdmission.claim,
        invalidAdmission.possessionProof
      )
    ).toBe(false)
    expect(prospectiveMember).toBeDefined()
    expect(() => {
      adminSigChain.invites.admitMemberFromInvite(invalidAdmission)
    }).toThrowError()
  })
  it('should invite device', () => {
    const newDevice = DeviceService.generateDeviceForUser(adminSigChain.user.userId)
    const deviceInvite = adminSigChain.invites.createDeviceInvite()
    const admission = InviteService.createDeviceAdmission({ seed: deviceInvite.seed, device: newDevice })
    expect(admission.proof).toBeDefined()
    expect(adminSigChain.invites.validateProof(admission.proof, admission.claim, admission.possessionProof)).toBe(true)
    adminSigChain.invites.admitDeviceFromInvite(admission)
    expect(adminSigChain.team!.hasDevice(newDevice.deviceId)).toBe(true)
  })
})
