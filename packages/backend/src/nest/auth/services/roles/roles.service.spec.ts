import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from './roles'
import { base58 } from '@localfirst/crypto'
import { InviteResult, MemberContext, Team } from '@localfirst/auth'
import { InviteService } from '../invites/invite.service'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from '../members/types'

const logger = createLogger('auth:services:roles.spec')

describe('roles', () => {
  let adminSigChain: SigChain
  let secondSigChain: SigChain
  const teamName = 'test'
  let invite: InviteResult

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
  it('should create second user who is not admin', () => {
    secondSigChain = SigChain.createFromInvite({ seed: invite.seed }, adminSigChain.team!.id)
    expect(secondSigChain).toBeDefined()
    expect(secondSigChain.context).toBeDefined()
    expect(base58.detect(secondSigChain.user.userName)).toBeTruthy()
    expect(secondSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
  })
  it('should add second user to team', () => {
    const admission = InviteService.createMemberAdmission({ seed: invite.seed, context: secondSigChain.context })
    adminSigChain.invites.admitMemberFromInvite(admission)
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
  it('should grant the MEMBER role when admitting the second user', () => {
    expect(secondSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
    expect(secondSigChain.roles.canICreateRole()).toBe(false)
    // A plain member may hold MEMBER but may not put anyone *else* in it. MEMBER being
    // self-assignable grants self-assignment only; adding another member is an admin act.
    expect(secondSigChain.roles.canIAddMembersToRole(RoleName.MEMBER)).toBe(false)
    expect(secondSigChain.roles.canIRemoveMembersFromRole(RoleName.MEMBER)).toBe(false)
    expect(secondSigChain.roles.canIDeleteRole(RoleName.MEMBER)).toBe(false)
  })
})
