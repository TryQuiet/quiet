import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from './roles'
import { hash, randomBytes } from '@localfirst/crypto'
import * as uint8arrays from 'uint8arrays'
import { generateProof, InviteResult, MemberContext, redactKeys, Team } from '@localfirst/auth'
import { InviteLockboxMetadata } from '../crypto/types'

const logger = createLogger('auth:services:channels.spec')

describe('channels', () => {
  let adminSigChain: SigChain
  let secondSigChain: SigChain
  const adminUsername = 'admin'
  const secondUsername = 'seconduser'
  const teamName = 'test'
  let invite: InviteResult
  let seed: string
  let salt: string
  let generatedKeys: InviteLockboxMetadata
  const channelId = 'foobar'

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create(teamName, adminUsername)
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.team!.teamName).toBe(teamName)
    expect(adminSigChain.user.userName).toBe(adminUsername)
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('should create channel and admin should be added as member', () => {
    const channel = adminSigChain.channels.create(channelId)
    expect(channel).toBeDefined()
    expect(channel).toBe(adminSigChain.channels.generateChannelRoleName(channelId))
    expect(adminSigChain.channels.amIMemberOfChannel(channelId))
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
  it('should fail to self-assign channel role on second user', () => {
    const failedSelfAssign = () =>
      secondSigChain.roles.addSelf(secondSigChain.channels.generateChannelRoleName(channelId), seed, salt)
    expect(failedSelfAssign).toThrow()
  })
  it('should add second user to channel', () => {
    adminSigChain.channels.addMember(secondSigChain.context.user.userId, channelId)
    expect(adminSigChain.channels.memberInChannel(secondSigChain.context.user.userId, channelId)).toBe(true)
  })
})

describe('channel membership authorization PoC', () => {
  const loadMemberFromAdminGraph = (adminChain: SigChain, memberChain: SigChain): void => {
    const teamKeyring = adminChain.team!.teamKeyring()
    const loadedTeam = new Team({
      source: adminChain.save(),
      context: {
        device: memberChain.context.device,
        user: memberChain.user,
      },
      teamKeyring,
    })
    loadedTeam.join(teamKeyring)
    memberChain.context = {
      device: memberChain.context.device,
      team: loadedTeam,
      user: memberChain.user,
    } as MemberContext
  }

  const admitMember = (adminChain: SigChain, username: string): SigChain => {
    const invite = adminChain.invites.createUserInvite()
    const memberChain = SigChain.createFromInvite(username, invite.seed)
    adminChain.invites.admitMemberFromInvite(
      generateProof(invite.seed),
      username,
      memberChain.context.user.userId,
      redactKeys(memberChain.context.user.keys)
    )
    loadMemberFromAdminGraph(adminChain, memberChain)
    return memberChain
  }

  it('accepts a non-owner channel member adding another member when the backend owner check is bypassed', () => {
    const owner = SigChain.create('test', 'owner')
    const channelId = 'owner-only-channel'
    const channelRoleName = owner.channels.create(channelId)
    const nonOwner = admitMember(owner, 'non-owner')
    const addedByNonOwner = admitMember(owner, 'added-by-non-owner')

    expect(owner.roles.amIAdmin()).toBe(true)
    expect(nonOwner.roles.amIAdmin()).toBe(false)
    expect(owner.team!.roles(channelRoleName).createdBy).toBe(owner.user.userId)
    expect(owner.channels.memberInChannel(addedByNonOwner.user.userId, channelId)).toBe(false)

    owner.channels.addMember(nonOwner.user.userId, channelId)
    nonOwner.team!.merge(owner.team!.graph)
    expect(nonOwner.channels.amIMemberOfChannel(channelId)).toBe(true)

    nonOwner.channels.addMember(addedByNonOwner.user.userId, channelId)

    owner.team!.merge(nonOwner.team!.graph)
    addedByNonOwner.team!.merge(nonOwner.team!.graph)

    expect(owner.channels.memberInChannel(addedByNonOwner.user.userId, channelId)).toBe(true)
    expect(addedByNonOwner.channels.amIMemberOfChannel(channelId)).toBe(true)
    expect(addedByNonOwner.team!.decrypt(owner.team!.encrypt('private message', channelRoleName))).toBe('private message')
  })
})
