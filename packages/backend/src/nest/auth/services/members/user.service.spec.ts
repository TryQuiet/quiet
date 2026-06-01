import { jest } from '@jest/globals'
import { SigChain } from '../../sigchain'
import { SigChainService } from '../../sigchain.service'
import { createLogger } from '../../../common/logger'
import { device, InviteResult, LocalUserContext } from '@localfirst/auth'
import { RoleName } from '..//roles/roles'
import { UserService } from './user.service'
import { DeviceService } from '../members/device.service'

const logger = createLogger('auth:services:users.spec')

describe('users', () => {
  let adminSigChain: SigChain

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create('test', 'user')
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.team!.teamName).toBe('test')
    expect(adminSigChain.user.userName).toBe('user')
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('should get keys', () => {
    const keys = adminSigChain.users.getKeys()
    expect(keys).toBeDefined()
  })
  it('get all members', () => {
    const users = adminSigChain.users.getAllUsers()
    expect(users).toBeDefined()
  })
  it('get admin member by id', () => {
    const users = adminSigChain.users.getUsersById([adminSigChain.user.userId])
    expect(users.map(u => u.userId)).toContain(adminSigChain.user.userId)
  })
  it('get admin member by name', () => {
    const user = adminSigChain.users.getUserByName(adminSigChain.user.userName)
    expect(user!.userName).toEqual(adminSigChain.user.userName)
  })
  it('should redact user', () => {
    const redactedUser = UserService.redactUser(adminSigChain.user)
    expect(redactedUser).toBeDefined()
    expect(redactedUser.userId).toBe(adminSigChain.user.userId)
    expect(redactedUser.userName).toBe(adminSigChain.user.userName)
  })
})
