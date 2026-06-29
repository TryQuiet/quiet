import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from './roles'
import { hash, randomBytes } from '@localfirst/crypto'
import * as uint8arrays from 'uint8arrays'
import { generateProof, InviteResult, MemberContext, redactKeys, Team } from '@localfirst/auth'
import { InviteLockboxMetadata } from '../crypto/types'

const logger = createLogger('auth:services:roles.spec')

describe('roles', () => {
  let adminSigChain: SigChain
  let secondSigChain: SigChain
  const adminUsername = 'admin'
  const secondUsername = 'seconduser'
  const teamName = 'test'
  let invite: InviteResult
  let seed: string
  let salt: string
  let generatedKeys: InviteLockboxMetadata

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create(teamName, adminUsername)
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.teamName).toBe(SigChain.generateTeamName(teamName))
    expect(adminSigChain.user.userName).toBe(adminUsername)
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
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
    secondSigChain = SigChain.createFromInvite(secondUsername, invite.seed)
    expect(secondSigChain).toBeDefined()
    expect(secondSigChain.context).toBeDefined()
    expect(secondSigChain.context.user.userName).toBe(secondUsername)
  })
  it('should add second user to team', () => {
    const proof = generateProof(invite.seed)
    adminSigChain.invites.admitMemberFromInvite(
      proof,
      secondUsername,
      secondSigChain.context.user.userId,
      redactKeys(secondSigChain.context.user.keys)
    )
    expect(adminSigChain.users.getUserByName(secondUsername)).toBeDefined()

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
  })
  it('should fail to self-assign ADMIN role on second user', () => {
    const failedSelfAssign = () => secondSigChain.roles.addSelf(RoleName.ADMIN, seed, salt)
    expect(failedSelfAssign).toThrow()
  })
})
