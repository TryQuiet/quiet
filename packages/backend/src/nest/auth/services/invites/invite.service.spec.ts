import { jest } from '@jest/globals'

import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from '..//roles/roles'
import { UserService } from '../members/user.service'
import { DEFAULT_DEVICE_INVITATION_VALID_FOR_MS, InviteService } from './invite.service'
import { DeviceService } from '../members/device.service'
import { base58, randomKey } from '@localfirst/crypto'
import type { DeviceInvitationClaim, MemberInvitationClaim } from '@localfirst/auth'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from '../members/types'

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
  it('admin should generate an invite seed and create a new user from it', () => {
    const invite = adminSigChain.invites.createUserInvite()
    expect(invite).toBeDefined()
    const prospectiveMember = UserService.createFromInviteSeed({ seed: invite.seed })
    const claim: MemberInvitationClaim = {
      invitationKind: 'member',
      userName: prospectiveMember.context.user.userName,
      userKeys: UserService.redactUser(prospectiveMember.context.user).keys,
      device: DeviceService.redactDevice(prospectiveMember.context.device),
    }
    const acceptorNonce = randomKey()
    const inviteProof = InviteService.generateProof(invite.seed, claim, acceptorNonce)
    expect(inviteProof).toBeDefined()
    expect(adminSigChain.invites.validateProof(inviteProof, claim, acceptorNonce)).toBe(true)
    expect(prospectiveMember).toBeDefined()
    expect(adminSigChain.invites.admitMemberFromInvite(inviteProof, claim, acceptorNonce)).toBeDefined()
    newMemberSigChain = SigChain.joinForTesting(
      prospectiveMember.context,
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
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('admin should be able to revoke an invite', () => {
    const inviteToRevoke = adminSigChain.invites.createUserInvite()
    expect(inviteToRevoke).toBeDefined()
    adminSigChain.invites.revoke(inviteToRevoke.id)
    const prospectiveMember = UserService.createFromInviteSeed({ seed: inviteToRevoke.seed })
    const claim: MemberInvitationClaim = {
      invitationKind: 'member',
      userName: prospectiveMember.context.user.userName,
      userKeys: UserService.redactUser(prospectiveMember.context.user).keys,
      device: DeviceService.redactDevice(prospectiveMember.context.device),
    }
    const acceptorNonce = randomKey()
    const InvalidInviteProof = InviteService.generateProof(inviteToRevoke.seed, claim, acceptorNonce)
    expect(InvalidInviteProof).toBeDefined()
    expect(adminSigChain.invites.validateProof(InvalidInviteProof, claim, acceptorNonce)).toBe(false)
  })
  it('admitting a new member with an invalid invite should fail', () => {
    const prospectiveMember = UserService.createFromInviteSeed({ seed: 'invalidseed' })
    const claim: MemberInvitationClaim = {
      invitationKind: 'member',
      userName: prospectiveMember.context.user.userName,
      userKeys: UserService.redactUser(prospectiveMember.context.user).keys,
      device: DeviceService.redactDevice(prospectiveMember.context.device),
    }
    const acceptorNonce = randomKey()
    const invalidInviteProof = InviteService.generateProof('invalidseed', claim, acceptorNonce)
    expect(invalidInviteProof).toBeDefined()
    expect(adminSigChain.invites.validateProof(invalidInviteProof, claim, acceptorNonce)).toBe(false)
    expect(prospectiveMember).toBeDefined()
    expect(() => {
      adminSigChain.invites.admitMemberFromInvite(invalidInviteProof, claim, acceptorNonce)
    }).toThrowError()
  })
  it('should invite device', () => {
    const now = 1_700_000_000_000
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(now)
    const newDevice = DeviceService.generateDeviceForUser(adminSigChain.user.userId)
    try {
      const deviceInvite = adminSigChain.invites.createDeviceInvite()
      const storedInvite = adminSigChain.invites.getById(deviceInvite.id)
      const { userId: _untrustedUserId, ...firstUseDevice } = DeviceService.redactDevice(newDevice)
      const claim: DeviceInvitationClaim = {
        invitationKind: 'device',
        userName: adminSigChain.user.userName,
        device: firstUseDevice,
      }
      const acceptorNonce = randomKey()
      const inviteProof = InviteService.generateProof(deviceInvite.seed, claim, acceptorNonce)

      expect(deviceInvite).toMatchObject({
        expiresAt: now + DEFAULT_DEVICE_INVITATION_VALID_FOR_MS,
        userId: adminSigChain.user.userId,
        userName: adminSigChain.user.userName,
      })
      expect(storedInvite.expiration).toBe(deviceInvite.expiresAt)
      expect(storedInvite.maxUses).toBe(1)
      expect(inviteProof).toBeDefined()
      expect(adminSigChain.invites.validateProof(inviteProof, claim, acceptorNonce)).toBe(true)
      adminSigChain.invites.admitDeviceFromInvite(inviteProof, claim, acceptorNonce)
      expect(adminSigChain.team!.hasDevice(newDevice.deviceId)).toBe(true)
    } finally {
      dateNowSpy.mockRestore()
    }
  })
})
