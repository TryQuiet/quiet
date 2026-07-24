import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from './roles'
import { base58, hash, randomBytes, randomKey } from '@localfirst/crypto'
import * as uint8arrays from 'uint8arrays'
import {
  generateProof,
  InviteResult,
  MemberContext,
  type MemberInvitationClaim,
  redactDevice,
  redactKeys,
  Team,
} from '@localfirst/auth'
import { InviteLockboxMetadata } from '../crypto/types'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from '../members/types'

const logger = createLogger('auth:services:roles.spec')

describe('roles', () => {
  let adminSigChain: SigChain
  let secondSigChain: SigChain
  const teamName = 'test'
  let invite: InviteResult
  let seed: string
  let salt: string
  let generatedKeys: InviteLockboxMetadata

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create()
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.teamName).toBeDefined()
    expect(base58.detect(adminSigChain.teamName!)).toBeTruthy()
    expect(adminSigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(base58.detect(adminSigChain.user.userName)).toBeTruthy()
    expect(adminSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
    expect(adminSigChain.roles.canICreateRole()).toBe(true)
    expect(adminSigChain.roles.canIAddMembersToRole(RoleName.MEMBER)).toBe(true)
    expect(adminSigChain.roles.canIRemoveMembersFromRole(RoleName.MEMBER)).toBe(true)
    expect(adminSigChain.roles.canIDeleteRole(RoleName.MEMBER)).toBe(true)
  })
  it('should create an invite', () => {
    invite = adminSigChain.invites.createUserInvite()
    expect(invite).toBeDefined()
  })
  it('should create keys from seed and salt for lockboxes', () => {
    seed = invite.seed
    salt = uint8arrays.toString(randomBytes(32), 'hex')
    generatedKeys = adminSigChain.lockbox.generateLockboxKeys(seed, salt)
    expect(generatedKeys.id).toBe(hash(salt, seed))
    expect(generatedKeys.keys.name).toBe(generatedKeys.id)
    expect(generatedKeys.keys.generation).toBe(0)
  })
  it('should create a lockbox encrypted to our generated keys with MEMBER keys', () => {
    const lockboxes = adminSigChain.lockbox.createInviteLockboxes(seed, salt)
    expect(lockboxes).toHaveLength(1)
    const keysFromLockbox = adminSigChain.team?.allKeys(generatedKeys.keys)
    expect(keysFromLockbox).toBeDefined()
    expect(keysFromLockbox!['ROLE'][RoleName.MEMBER].length).toBe(1)
  })
  it('should create second user who is not admin', () => {
    secondSigChain = SigChain.createFromInvite({ seed: invite.seed })
    expect(secondSigChain).toBeDefined()
    expect(secondSigChain.context).toBeDefined()
    expect(base58.detect(secondSigChain.user.userName)).toBeTruthy()
    expect(secondSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
  })
  it('should add second user to team', () => {
    const claim: MemberInvitationClaim = {
      invitationKind: 'member',
      userName: secondSigChain.user.userName,
      userKeys: redactKeys(secondSigChain.user.keys),
      device: redactDevice(secondSigChain.context.device),
    }
    const acceptorNonce = randomKey()
    const proof = generateProof({
      seed: invite.seed,
      claim,
      acceptorNonce,
      inviteeNonce: randomKey(),
    })
    adminSigChain.invites.admitMemberFromInvite(proof, claim, acceptorNonce)
    expect(() => adminSigChain.users.getUserById(secondSigChain.user.userId)).not.toThrow()

    const teamBytes = adminSigChain.save()
    const teamKeyring = adminSigChain.team!.teamKeyring()
    expect(teamKeyring).toBeDefined()
    const loadedTeam = new Team({
      source: teamBytes,
      context: {
        device: secondSigChain.context.device,
        user: secondSigChain.user,
      },
      teamKeyring,
    })
    loadedTeam.join(teamKeyring)
    secondSigChain.context = {
      device: secondSigChain.context.device,
      team: loadedTeam,
      user: secondSigChain.user,
    } as MemberContext
    expect(secondSigChain.team).toBeDefined()
  })
  it('should self-assign MEMBER role on second user', () => {
    secondSigChain.roles.addSelf(RoleName.MEMBER, seed, salt)
    expect(secondSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
    expect(secondSigChain.roles.canICreateRole()).toBe(false)
    expect(secondSigChain.roles.canIAddMembersToRole(RoleName.MEMBER)).toBe(true)
    expect(secondSigChain.roles.canIRemoveMembersFromRole(RoleName.MEMBER)).toBe(false)
    expect(secondSigChain.roles.canIDeleteRole(RoleName.MEMBER)).toBe(false)
  })
  it('should fail to self-assign ADMIN role on second user', () => {
    const failedSelfAssign = () => secondSigChain.roles.addSelf(RoleName.ADMIN, seed, salt)
    expect(failedSelfAssign).toThrow()
  })
})
