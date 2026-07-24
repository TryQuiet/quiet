import { jest } from '@jest/globals'
import { SigChain } from './sigchain'
import { createLogger } from '../common/logger'
import { LocalUserContext, Team, UserWithSecrets } from '3rd-party/auth/packages/auth/dist'
import { base58 } from '@localfirst/crypto'
import { RANDOM_TEAM_NAME_LENGTH } from './types'
import { RANDOM_USERNAME_LENGTH } from './services/members/types'

const logger = createLogger('auth:sigchainManager.spec')

describe('SigChain', () => {
  let sigChain: SigChain

  it('should initialize a new sigchain and be admin', () => {
    sigChain = SigChain.create()
    expect(sigChain).toBeDefined()
    expect(sigChain.context).toBeDefined()
    expect(sigChain.roles.amIAdmin()).toBe(true)
    expect(sigChain.roles.amIMember()).toBe(true)
    expect(sigChain.teamName).toBeDefined()
    expect(base58.detect(sigChain.teamName!)).toBeTruthy()
    expect(sigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(base58.detect(sigChain.user.userName)).toBeTruthy()
    expect(sigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
  })
  it('admin should not have a role that does not exist', () => {
    expect(sigChain.roles.amIMemberOfRole('nonexistent')).toBe(false)
  })
  it('should serialize the sigchain and load it', () => {
    const serializedChain = sigChain.save()
    const localUserContext = { user: sigChain.user, device: sigChain.device } as LocalUserContext
    const sigChain2 = SigChain.load(serializedChain, localUserContext, sigChain.team!.teamKeyring())
    expect(sigChain2).toBeDefined()
    expect(sigChain2.teamName).toBeDefined()
    expect(base58.detect(sigChain2.teamName!)).toBeTruthy()
    expect(sigChain2.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(sigChain2.teamName).toBe(sigChain.teamName)
    expect(sigChain2.roles.amIAdmin()).toBe(true)
    expect(sigChain2.roles.amIMember()).toBe(true)
  })

  describe('device invitation admission', () => {
    const expectedTeamId = 'expected-team'
    const expectedUserId = 'expected-user'
    let pendingChain: SigChain

    beforeEach(() => {
      pendingChain = SigChain.createFromDeviceInvite({
        seed: 'invitation-seed',
        userName: 'alice',
        deviceName: 'Alice’s phone',
        expectedTeamId,
        expectedUserId,
      })
    })

    const admittedUser = {
      userId: expectedUserId,
      userName: 'alice',
    } as UserWithSecrets

    const admittedTeam = (deviceId: string, overrides: { id?: string; hasDevice?: boolean } = {}) =>
      ({
        id: overrides.id ?? expectedTeamId,
        hasDevice: jest.fn().mockReturnValue(overrides.hasDevice ?? true),
        on: jest.fn(),
        removeListener: jest.fn(),
      }) as unknown as Team

    it('creates an invitee-device context and completes it only after validation', () => {
      const pendingDeviceId = pendingChain.device.deviceId
      expect(pendingChain.isPendingDeviceAdmission).toBe(true)
      expect(pendingChain.context).not.toHaveProperty('user')
      expect(pendingChain.device).not.toHaveProperty('userId')

      pendingChain.completeInvitation(admittedTeam(pendingDeviceId), admittedUser)

      expect(pendingChain.isPendingDeviceAdmission).toBe(false)
      expect(pendingChain.user.userId).toBe(expectedUserId)
      expect(pendingChain.device).toMatchObject({ userId: expectedUserId })
      expect(pendingChain.team?.id).toBe(expectedTeamId)
    })

    it.each([
      ['team', admittedTeam('device', { id: 'tampered-team' }), admittedUser],
      ['user', admittedTeam('device'), { ...admittedUser, userId: 'tampered-user' }],
      ['device', admittedTeam('device', { hasDevice: false }), admittedUser],
    ])('rejects a mismatched recovered %s', (_field, team, user) => {
      expect(() => pendingChain.completeInvitation(team, user as UserWithSecrets)).toThrow(/admission|does not contain/)
      expect(pendingChain.isPendingDeviceAdmission).toBe(true)
      expect(pendingChain.context).not.toHaveProperty('team')
    })
  })
})
