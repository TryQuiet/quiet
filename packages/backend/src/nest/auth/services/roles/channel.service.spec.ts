import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { DEFAULT_CHANNEL_ROLE_NAME_LENGTH, RoleName } from './roles'
import { base58, hash, randomBytes } from '@localfirst/crypto'
import * as uint8arrays from 'uint8arrays'
import { generateProof, InviteResult, MemberContext, redactKeys, Team } from '@localfirst/auth'
import { InviteLockboxMetadata } from '../crypto/types'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from '../members/types'
import { randomUUID } from 'crypto'

const logger = createLogger('auth:services:channels.spec')

describe('channels', () => {
  let adminSigChain: SigChain
  let secondSigChain: SigChain
  const teamName = 'test'
  let invite: InviteResult
  let seed: string
  let salt: string
  let generatedKeys: InviteLockboxMetadata
  let channelRoleName: string

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
    expect(adminSigChain.roles.amIMember()).toBe(true)
    expect(adminSigChain.channels.canICreatePrivateChannel()).toBe(true)
    expect(adminSigChain.channels.canICreatePublicChannel()).toBe(true)
    expect(adminSigChain.channels.canIDeletePublicChannel()).toBe(true)
  })
  it('should create channel and admin should be added as member', () => {
    channelRoleName = adminSigChain.channels.create()
    expect(channelRoleName).toBeDefined()
    expect(channelRoleName).toHaveLength(DEFAULT_CHANNEL_ROLE_NAME_LENGTH)
    expect(adminSigChain.channels.amIMemberOfChannel(channelRoleName)).toBe(true)
    expect(adminSigChain.channels.canIAddMembersToPrivateChannel(channelRoleName)).toBe(true)
    expect(adminSigChain.channels.canIRemoveMembersFromPrivateChannel(channelRoleName)).toBe(true)
    expect(adminSigChain.channels.canIDeletePrivateChannel(channelRoleName)).toBe(true)
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
    const proof = generateProof(invite.seed)
    adminSigChain.invites.admitMemberFromInvite(
      proof,
      secondSigChain.user.userName,
      secondSigChain.context.user.userId,
      redactKeys(secondSigChain.context.user.keys)
    )
    expect(adminSigChain.users.getUserById(secondSigChain.user.userId)).toBeDefined()

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
    const failedSelfAssign = () => secondSigChain.roles.addSelf(channelRoleName, seed, salt)
    expect(failedSelfAssign).toThrow()
  })
  it('should add second user to channel', () => {
    adminSigChain.channels.addMember(secondSigChain.context.user.userId, channelRoleName)
    expect(adminSigChain.channels.memberInChannel(secondSigChain.context.user.userId, channelRoleName)).toBe(true)
    expect(
      adminSigChain.channels.canMemberAddMembersToPrivateChannel(secondSigChain.context.user.userId, channelRoleName)
    ).toBe(false)
    expect(
      adminSigChain.channels.canMemberRemoveMembersFromPrivateChannel(
        secondSigChain.context.user.userId,
        channelRoleName
      )
    ).toBe(false)
    expect(
      adminSigChain.channels.canMemberDeletePrivateChannel(secondSigChain.context.user.userId, channelRoleName)
    ).toBe(false)
  })
  it('should fail to create channel on second user', () => {
    expect(secondSigChain.roles.amIAdmin()).toBe(false)
    expect(secondSigChain.channels.canICreatePublicChannel()).toBe(false)
    expect(secondSigChain.channels.canICreatePrivateChannel()).toBe(false)
    expect(secondSigChain.channels.canIDeletePublicChannel()).toBe(false)

    const failedToCreateChannel = () => secondSigChain.channels.create()
    expect(failedToCreateChannel).toThrow()
  })
})
